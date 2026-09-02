from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import hashlib
import magic

from app.db.session import SessionLocal
from app.models.user import User
from app.models.document import Document, DocumentType, ProcessingStatus
from app.schemas.document import DocumentOut
from app.api.deps import get_current_user
from app.services.pdf_service import extract_metadata
from app.services.pipeline_service import process_document
from app.services.vector_service import vector_service

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

STORAGE_DIR = "storage/documents"
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.get("/", response_model=List[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List documents belonging strictly to the current authenticated user account."""
    return db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.uploaded_at.desc()).all()

@router.get("/{id}", response_model=DocumentOut)
def get_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation
    file_content = await file.read()
    
    # Check size (e.g. 25MB limit)
    if len(file_content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 25MB)")
        
    # Check mime type using magic
    mime = magic.Magic(mime=True)
    file_mime = mime.from_buffer(file_content)
    if file_mime != "application/pdf":
        raise HTTPException(status_code=422, detail="File must be a valid PDF")
        
    # Check Hash for this user
    file_hash = hashlib.sha256(file_content).hexdigest()
    existing = db.query(Document).filter(
        Document.file_hash == file_hash,
        Document.owner_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Document with this content already exists in your library")

    # Save temp file for metadata extraction
    temp_path = f"{STORAGE_DIR}/temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(file_content)
        
    # 2. Extract Metadata synchronously
    try:
        meta = extract_metadata(temp_path)
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=422, detail=f"PDF Validation failed: {str(e)}")

    if meta.get("page_count", 0) > 500:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=422, detail="Document exceeds maximum page limit (500)")

    # 3. Create Document DB Record scoped to current_user
    new_doc = Document(
        filename=file.filename,
        original_name=file.filename,
        file_path="",  # will update after getting ID
        document_type=document_type,
        owner_id=current_user.id,
        file_hash=file_hash,
        page_count=meta.get("page_count"),
        pdf_title=meta.get("title"),
        pdf_author=meta.get("author"),
        is_encrypted=meta.get("is_encrypted"),
        processing_status=ProcessingStatus.uploaded
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # 4. Move to final storage
    final_dir = f"{STORAGE_DIR}/{new_doc.id}"
    os.makedirs(final_dir, exist_ok=True)
    final_path = f"{final_dir}/{file.filename}"
    shutil.move(temp_path, final_path)
    
    new_doc.file_path = final_path
    db.commit()

    # 5. Enqueue processing pipeline
    background_tasks.add_task(process_document, new_doc.id)

    return new_doc

@router.get("/{id}/status")
def get_document_status(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    from app.models.document_chunk import DocumentChunk
    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == id).count()
    
    return {
        "processing_status": doc.processing_status.value,
        "processing_error": doc.processing_error,
        "page_count": doc.page_count,
        "chunk_count": chunk_count
    }

@router.post("/{id}/reprocess")
def reprocess_document(
    id: str, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    vector_service.delete_document_vectors(doc.id)
    doc.processing_status = ProcessingStatus.uploaded
    doc.processing_error = None
    db.commit()
    
    background_tasks.add_task(process_document, doc.id)
    return {"message": "Reprocessing started"}

@router.delete("/{id}")
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        vector_service.delete_document_vectors(doc.id)
    except Exception:
        pass
    
    from app.models.document_chunk import DocumentChunk
    from app.models.report import Report
    from app.models.compliance import ComplianceResult
    from app.models.analysis import DocumentAnalysis
    
    db.query(DocumentChunk).filter(DocumentChunk.document_id == id).delete()
    db.query(Report).filter(Report.document_id == id).delete()
    db.query(ComplianceResult).filter(ComplianceResult.document_id == id).delete()
    db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == id).delete()
    
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
            dir_path = os.path.dirname(doc.file_path)
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path, ignore_errors=True)
        except OSError:
            pass
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/{id}/download")
def download_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    return FileResponse(doc.file_path, filename=doc.filename, media_type="application/pdf")

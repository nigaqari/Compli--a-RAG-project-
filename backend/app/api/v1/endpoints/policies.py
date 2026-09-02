from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import hashlib
import magic

from app.db.session import SessionLocal
from app.models.user import User
from app.models.policy import Policy, PolicyVersion, PolicyCategory, ProcessingStatus
from app.models.document import Document, DocumentType
from app.schemas.policy import PolicyOut, PolicyVersionOut
from app.api.deps import get_current_user
from app.services.pipeline_service import process_document

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

STORAGE_DIR = "storage/policies"
os.makedirs(STORAGE_DIR, exist_ok=True)

@router.get("/", response_model=List[PolicyOut])
def list_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List policies belonging strictly to the current authenticated user account."""
    return db.query(Policy).filter(Policy.owner_id == current_user.id).order_by(Policy.created_at.desc()).all()

@router.get("/{id}", response_model=PolicyOut)
def get_policy(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(Policy).filter(Policy.id == id, Policy.owner_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("/", response_model=PolicyOut)
async def create_policy(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    category: PolicyCategory = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validation
    file_content = await file.read()
    if len(file_content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 25MB)")
        
    mime = magic.Magic(mime=True)
    file_mime = mime.from_buffer(file_content)
    if file_mime != "application/pdf":
        raise HTTPException(status_code=422, detail="File must be a valid PDF")
        
    file_hash = hashlib.sha256(file_content).hexdigest()

    # 2. Save Policy
    new_policy = Policy(
        name=name,
        category=category,
        file_path="", 
        owner_id=current_user.id,
        current_version=1
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    # 3. Save as Document for pipeline processing
    new_doc = Document(
        filename=file.filename,
        original_name=file.filename,
        file_path="", 
        document_type=DocumentType.policy,
        owner_id=current_user.id,
        file_hash=file_hash,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # 4. Save Policy Version
    final_dir = f"{STORAGE_DIR}/{new_policy.id}/v1"
    os.makedirs(final_dir, exist_ok=True)
    final_path = f"{final_dir}/{file.filename}"
    with open(final_path, "wb") as f:
        f.write(file_content)
        
    new_doc.file_path = final_path
    new_policy.file_path = final_path

    version = PolicyVersion(
        policy_id=new_policy.id,
        version_number=1,
        file_path=final_path,
        uploaded_by=current_user.id,
        change_note="Initial upload",
        document_id=new_doc.id
    )
    db.add(version)
    db.commit()
    
    # 5. Process in background
    background_tasks.add_task(process_document, new_doc.id)
    return new_policy

@router.post("/{id}/versions", response_model=PolicyVersionOut)
async def upload_policy_version(
    id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    change_note: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(Policy).filter(Policy.id == id, Policy.owner_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    file_content = await file.read()
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    next_version = policy.current_version + 1
    
    # Save as Document
    new_doc = Document(
        filename=file.filename,
        original_name=file.filename,
        file_path="", 
        document_type=DocumentType.policy,
        owner_id=current_user.id,
        file_hash=file_hash,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    final_dir = f"{STORAGE_DIR}/{policy.id}/v{next_version}"
    os.makedirs(final_dir, exist_ok=True)
    final_path = f"{final_dir}/{file.filename}"
    with open(final_path, "wb") as f:
        f.write(file_content)

    new_doc.file_path = final_path
    policy.file_path = final_path
    policy.current_version = next_version

    version = PolicyVersion(
        policy_id=policy.id,
        version_number=next_version,
        file_path=final_path,
        uploaded_by=current_user.id,
        change_note=change_note,
        document_id=new_doc.id
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    background_tasks.add_task(process_document, new_doc.id)
    return version

@router.get("/{id}/versions", response_model=List[PolicyVersionOut])
def list_policy_versions(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(Policy).filter(Policy.id == id, Policy.owner_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    versions = db.query(PolicyVersion).filter(PolicyVersion.policy_id == id).order_by(PolicyVersion.version_number.desc()).all()
    return versions

@router.get("/{id}/versions/{version_number}", response_model=PolicyVersionOut)
def get_policy_version(
    id: str,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(Policy).filter(Policy.id == id, Policy.owner_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    version = db.query(PolicyVersion).filter(
        PolicyVersion.policy_id == id, 
        PolicyVersion.version_number == version_number
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

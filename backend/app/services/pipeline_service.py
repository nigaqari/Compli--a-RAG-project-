import logging
import traceback
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.document import Document, ProcessingStatus
from app.models.document_chunk import DocumentChunk
from app.services.pdf_service import extract_text_by_page, extract_metadata, ScannedPDFError
from app.services.text_cleaning import clean_pages
from app.services.chunk_service import chunk_document
from app.services.embedding_service import embedding_service
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)

def process_document(document_id: str):
    """
    Background task to process a document end-to-end.
    Extract -> Clean -> Chunk -> Embed -> Store.
    """
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        # 1. Mark as processing
        doc.processing_status = ProcessingStatus.processing
        doc.processing_error = None
        db.commit()

        # 2. Extract Text
        try:
            pages = extract_text_by_page(doc.file_path)
        except ScannedPDFError:
            doc.processing_status = ProcessingStatus.failed
            doc.processing_error = "scanned_pdf_no_text_layer"
            doc.processed_at = datetime.now(timezone.utc)
            db.commit()
            return
            
        # 3. Clean Text
        cleaned_pages = clean_pages(pages)
        
        # 4. Chunk
        # Using default settings (could fetch from ApplicationSettings)
        chunks = chunk_document(cleaned_pages, chunk_size=500, overlap=75)
        
        # 5. Embed
        chunk_texts = [c.text for c in chunks]
        embeddings = embedding_service.embed_chunks(chunk_texts)
        
        # 6. Store Vectors in ChromaDB
        vector_service.upsert_chunks(
            document_id=doc.id,
            owner_id=doc.owner_id,
            document_type=doc.document_type.value,
            chunks=chunks,
            embeddings=embeddings
        )
        
        # 7. Store Chunks in SQLite
        db_chunks = []
        for chunk in chunks:
            vector_id = f"{doc.id}_{chunk.chunk_index}"
            db_chunks.append(DocumentChunk(
                document_id=doc.id,
                chunk_index=chunk.chunk_index,
                page_number=chunk.page_number,
                text=chunk.text,
                vector_id=vector_id,
                char_start=chunk.char_start,
                char_end=chunk.char_end
            ))
            
        # Clear existing chunks if any (e.g. during reprocess)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        
        # Bulk insert
        db.bulk_save_objects(db_chunks)
        
        # 8. Mark completed
        doc.processing_status = ProcessingStatus.completed
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Successfully processed document {document_id}")

        # 9. Trigger policy extraction if it's a policy
        doc_type_str = doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type)
        if doc_type_str == "policy":
            from app.models.policy import PolicyVersion
            from app.services.policy_extraction_service import run_policy_extraction, persist_policy_requirements
            
            # Find the policy version associated with this document
            version = db.query(PolicyVersion).filter(PolicyVersion.document_id == doc.id).first()
            if version:
                try:
                    logger.info(f"Triggering policy extraction for version {version.id}")
                    extracted = run_policy_extraction(db, doc.owner_id, version.id)
                    persist_policy_requirements(db, version.id, extracted)
                except Exception as e:
                    logger.error(f"Policy extraction failed for version {version.id}: {str(e)}")
                    logger.error(traceback.format_exc())

    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logger.error(f"Failed to process document {document_id}: {error_msg}")
        logger.error(traceback.format_exc())
        
        # Reload to update status safely
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.processing_status = ProcessingStatus.failed
            doc.processing_error = error_msg[:500]
            doc.processed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.analysis import DocumentAnalysis, AnalysisStatus
from app.schemas.analysis import AnalysisOut
from app.api.deps import get_current_user
from app.services.analysis_service import run_full_analysis

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/documents/{document_id}/analyze")
def trigger_analysis(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers a full AI analysis pipeline as a background task for a user document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in your library")

    if doc.processing_status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Document must be fully processed before analysis. Current status: {doc.processing_status}"
        )

    # Create a pending analysis row
    analysis = DocumentAnalysis(document_id=document_id, status=AnalysisStatus.pending)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Schedule the actual work in the background
    background_tasks.add_task(_run_analysis_background, analysis.id, document_id, current_user.id)

    return {"analysis_id": analysis.id, "status": "pending"}

def _run_analysis_background(analysis_id: str, document_id: str, user_id: str):
    """Background wrapper that opens its own DB session."""
    db = SessionLocal()
    try:
        run_full_analysis(db, document_id, user_id=user_id, analysis_id=analysis_id)
    finally:
        db.close()

@router.get("/documents/{document_id}/analysis", response_model=AnalysisOut)
def get_latest_analysis(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the latest completed analysis for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    analysis = (
        db.query(DocumentAnalysis)
        .filter(
            DocumentAnalysis.document_id == document_id,
            DocumentAnalysis.status == AnalysisStatus.completed
        )
        .order_by(DocumentAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No completed analysis found for this document")
    return analysis

@router.get("/documents/{document_id}/analysis/status")
def get_analysis_status(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lightweight polling endpoint for analysis status."""
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        return {"status": "none", "analysis_id": None}

    analysis = (
        db.query(DocumentAnalysis)
        .filter(DocumentAnalysis.document_id == document_id)
        .order_by(DocumentAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        return {"status": "none", "analysis_id": None}

    return {
        "status": analysis.status.value,
        "analysis_id": analysis.id,
        "error": analysis.error,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
    }

@router.get("/analysis/{analysis_id}", response_model=AnalysisOut)
def get_analysis_by_id(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch a specific historical analysis run by its ID."""
    analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    doc = db.query(Document).filter(Document.id == analysis.document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Not authorized to view this analysis")
    return analysis

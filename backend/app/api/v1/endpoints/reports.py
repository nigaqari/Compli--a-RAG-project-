import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.db.session import SessionLocal
from app.models.user import User
from app.models.report import Report, ReportStatus, ReportType
from app.models.document import Document
from app.schemas.report import ReportCreate, ReportOut, ReportStatusOut
from app.api.deps import get_current_user
from app.services.report_service import run_generate_report_task

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ReportOut)
def create_report(
    req: ReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == req.document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in your library")

    report = Report(
        document_id=req.document_id,
        generated_by=current_user.id,
        report_type=req.report_type,
        status=ReportStatus.pending
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    background_tasks.add_task(run_generate_report_task, report.id)

    out = ReportOut.model_validate(report)
    out.document_name = doc.original_name or doc.filename
    return out

@router.get("/", response_model=List[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(Report.generated_by == current_user.id).order_by(Report.created_at.desc()).all()
    results = []
    for r in reports:
        doc = db.query(Document).filter(Document.id == r.document_id).first()
        out = ReportOut.model_validate(r)
        out.document_name = doc.original_name or doc.filename if doc else "Unknown"
        results.append(out)
    return results

@router.get("/{id}", response_model=ReportOut)
def get_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id, Report.generated_by == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    doc = db.query(Document).filter(Document.id == report.document_id).first()
    out = ReportOut.model_validate(report)
    out.document_name = doc.original_name or doc.filename if doc else "Unknown"
    return out

@router.get("/{id}/status", response_model=ReportStatusOut)
def get_report_status(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id, Report.generated_by == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{id}/download")
def download_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id, Report.generated_by == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != ReportStatus.completed or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report PDF file is not available for download")

    doc = db.query(Document).filter(Document.id == report.document_id).first()
    clean_name = (doc.original_name or doc.filename) if doc else "document"
    clean_name = clean_name.replace(".pdf", "")
    filename = f"Compli_{report.report_type.value}_{clean_name}.pdf"

    return FileResponse(
        report.file_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.delete("/{id}")
def delete_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == id, Report.generated_by == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except OSError:
            pass
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}

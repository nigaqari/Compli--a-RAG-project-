import os
import io
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.report import Report, ReportType, ReportStatus
from app.models.document import Document
from app.services.report_data_service import (
    assemble_executive_summary_data,
    assemble_compliance_report_data,
    assemble_risk_assessment_data,
    assemble_complete_analysis_data
)
from app.services.reports.executive_summary_report import build_executive_summary_report
from app.services.reports.compliance_report import build_compliance_report
from app.services.reports.risk_assessment_report import build_risk_assessment_report
from app.services.reports.complete_analysis_report import build_complete_analysis_report

logger = logging.getLogger(__name__)

REPORTS_STORAGE_DIR = "storage/reports"
os.makedirs(REPORTS_STORAGE_DIR, exist_ok=True)

def generate_report_bytes(db: Session, report_type: str, document_id: str, compliance_result_id: str = None) -> bytes:
    """Generates PDF bytes for the specified report type and document."""
    norm_type = report_type.lower()

    if norm_type in ["executive_summary", "exec_summary"]:
        data = assemble_executive_summary_data(db, document_id)
        buf = build_executive_summary_report(data)
    elif norm_type == "compliance":
        data = assemble_compliance_report_data(db, document_id, compliance_result_id)
        buf = build_compliance_report(data)
    elif norm_type in ["risk_assessment", "risk"]:
        data = assemble_risk_assessment_data(db, document_id)
        buf = build_risk_assessment_report(data)
    elif norm_type in ["complete_analysis", "full"]:
        data = assemble_complete_analysis_data(db, document_id)
        buf = build_complete_analysis_report(data)
    else:
        raise ValueError(f"Unknown report type: {report_type}")

    return buf.getvalue()

def run_generate_report_task(report_id: str):
    """Background task to generate and persist the report PDF file."""
    db: Session = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            logger.error(f"Report {report_id} not found")
            return

        report.status = ReportStatus.generating
        db.commit()

        rtype = report.report_type.value if hasattr(report.report_type, 'value') else str(report.report_type)
        pdf_bytes = generate_report_bytes(db, rtype, report.document_id)

        file_path = f"{REPORTS_STORAGE_DIR}/{report.id}.pdf"
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        report.file_path = file_path
        report.status = ReportStatus.completed
        report.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Report {report_id} generated successfully at {file_path}")

    except Exception as e:
        logger.exception(f"Report generation failed for {report_id}")
        db.rollback()
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.failed
            report.error = str(e)
            db.commit()
    finally:
        db.close()

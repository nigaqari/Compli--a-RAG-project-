from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.db.session import SessionLocal
from app.models.user import User
from app.models.document import Document
from app.models.analysis import DocumentAnalysis, AnalysisStatus, Risk, RiskSeverity
from app.api.deps import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate stats for the dashboard KPI cards, strictly scoped to the current user."""
    total_documents = (
        db.query(func.count(Document.id))
        .filter(Document.owner_id == current_user.id)
        .scalar() or 0
    )

    # Pending reviews = user's documents that are processed but have no completed analysis
    analyzed_ids = (
        db.query(DocumentAnalysis.document_id)
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(
            Document.owner_id == current_user.id,
            DocumentAnalysis.status == AnalysisStatus.completed
        )
        .distinct()
        .subquery()
    )
    pending_reviews = (
        db.query(func.count(Document.id))
        .filter(
            Document.owner_id == current_user.id,
            Document.processing_status == "completed",
            ~Document.id.in_(db.query(analyzed_ids.c.document_id))
        )
        .scalar() or 0
    )

    # User's Risk counts
    user_analysis_subquery = (
        db.query(DocumentAnalysis.id)
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .subquery()
    )

    high_risks = (
        db.query(func.count(Risk.id))
        .filter(
            Risk.analysis_id.in_(db.query(user_analysis_subquery.c.id)),
            Risk.severity == RiskSeverity.high
        )
        .scalar() or 0
    )
    medium_risks = (
        db.query(func.count(Risk.id))
        .filter(
            Risk.analysis_id.in_(db.query(user_analysis_subquery.c.id)),
            Risk.severity == RiskSeverity.medium
        )
        .scalar() or 0
    )
    low_risks = (
        db.query(func.count(Risk.id))
        .filter(
            Risk.analysis_id.in_(db.query(user_analysis_subquery.c.id)),
            Risk.severity == RiskSeverity.low
        )
        .scalar() or 0
    )
    open_risks = high_risks + medium_risks + low_risks

    # Avg compliance score across user's analyzed docs
    avg_score = (
        db.query(func.avg(DocumentAnalysis.compliance_score))
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(
            Document.owner_id == current_user.id,
            DocumentAnalysis.compliance_score.isnot(None)
        )
        .scalar()
    )

    return {
        "total_documents": total_documents,
        "pending_reviews": pending_reviews,
        "open_risks": open_risks,
        "high_risks": high_risks,
        "medium_risks": medium_risks,
        "low_risks": low_risks,
        "avg_compliance_score": round(avg_score) if avg_score else None
    }

@router.get("/risk-breakdown")
def get_risk_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Counts of High/Medium/Low risks across user's analyzed documents."""
    user_analysis_subquery = (
        db.query(DocumentAnalysis.id)
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .subquery()
    )

    results = (
        db.query(Risk.severity, func.count(Risk.id))
        .filter(Risk.analysis_id.in_(db.query(user_analysis_subquery.c.id)))
        .group_by(Risk.severity)
        .all()
    )
    breakdown = {"high": 0, "medium": 0, "low": 0}
    for severity, count in results:
        val = severity.value if hasattr(severity, 'value') else str(severity)
        breakdown[val] = count
    return breakdown

@router.get("/activity-trend")
def get_activity_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """User's documents analyzed over time, bucketed by date."""
    results = (
        db.query(
            func.date(DocumentAnalysis.completed_at).label("date"),
            func.count(DocumentAnalysis.id).label("count")
        )
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(
            Document.owner_id == current_user.id,
            DocumentAnalysis.status == AnalysisStatus.completed,
            DocumentAnalysis.completed_at.isnot(None)
        )
        .group_by(func.date(DocumentAnalysis.completed_at))
        .order_by(func.date(DocumentAnalysis.completed_at))
        .all()
    )
    return [{"date": str(row.date), "count": row.count} for row in results]

@router.get("/recent-analyses")
def get_recent_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """Last N completed analyses for the current user."""
    analyses = (
        db.query(DocumentAnalysis)
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(
            Document.owner_id == current_user.id,
            DocumentAnalysis.status == AnalysisStatus.completed
        )
        .order_by(DocumentAnalysis.completed_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for a in analyses:
        doc = db.query(Document).filter(Document.id == a.document_id).first()
        top_risk = (
            db.query(Risk)
            .filter(Risk.analysis_id == a.id)
            .order_by(
                case(
                    (Risk.severity == RiskSeverity.high, 1),
                    (Risk.severity == RiskSeverity.medium, 2),
                    (Risk.severity == RiskSeverity.low, 3),
                    else_=4
                )
            )
            .first()
        )
        results.append({
            "analysis_id": a.id,
            "document_id": a.document_id,
            "document_name": doc.original_name or doc.filename if doc else "Unknown",
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "top_risk_severity": top_risk.severity.value if top_risk else None,
            "risk_count": len(a.risks),
        })
    return results

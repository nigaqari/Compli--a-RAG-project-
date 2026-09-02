from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.policy import Policy
from app.models.report import Report
from app.models.analysis import DocumentAnalysis, AnalysisClause, Risk

def global_search(db: Session, query: str, user_id: str, limit_per_type: int = 5) -> Dict[str, List[Dict[str, Any]]]:
    """
    Performs fast full-text keyword search across user's Documents, Clauses, Risks, Policies, and Reports.
    Strictly isolated per user_id.
    """
    clean_q = query.strip()
    if not clean_q:
        return {
            "documents": [],
            "clauses": [],
            "risks": [],
            "policies": [],
            "reports": []
        }

    pattern = f"%{clean_q}%"

    # 1. Documents
    docs = (
        db.query(Document)
        .filter(
            Document.owner_id == user_id,
            (
                (Document.filename.ilike(pattern)) |
                (Document.original_name.ilike(pattern)) |
                (Document.pdf_title.ilike(pattern))
            )
        )
        .limit(limit_per_type)
        .all()
    )
    doc_results = [
        {
            "id": d.id,
            "title": d.original_name or d.filename,
            "snippet": f"Document Type: {d.document_type.value if hasattr(d.document_type, 'value') else d.document_type} • Pages: {d.page_count or 'N/A'}",
            "type": "document",
            "url": f"/documents/{d.id}"
        }
        for d in docs
    ]

    # 2. Policies
    policies = (
        db.query(Policy)
        .filter(
            Policy.owner_id == user_id,
            (
                (Policy.name.ilike(pattern)) |
                (Policy.category.ilike(pattern))
            )
        )
        .limit(limit_per_type)
        .all()
    )
    policy_results = [
        {
            "id": p.id,
            "title": p.name,
            "snippet": f"Category: {p.category.value.replace('_', ' ').title() if hasattr(p.category, 'value') else str(p.category)} • Current Version: v{p.current_version}",
            "type": "policy",
            "url": f"/policies/{p.id}"
        }
        for p in policies
    ]

    # 3. Risks & 4. Clauses
    user_doc_ids = db.query(Document.id).filter(Document.owner_id == user_id).subquery()
    user_analysis_ids = db.query(DocumentAnalysis.id).filter(DocumentAnalysis.document_id.in_(db.query(user_doc_ids.c.id))).subquery()

    risks = (
        db.query(Risk)
        .filter(
            Risk.analysis_id.in_(db.query(user_analysis_ids.c.id)),
            (
                (Risk.title.ilike(pattern)) |
                (Risk.rationale.ilike(pattern))
            )
        )
        .limit(limit_per_type)
        .all()
    )
    risk_results = []
    for r in risks:
        analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == r.analysis_id).first()
        doc_id = analysis.document_id if analysis else "placeholder"
        risk_results.append({
            "id": r.id,
            "title": r.title,
            "snippet": (r.rationale[:120] + "...") if r.rationale and len(r.rationale) > 120 else (r.rationale or ""),
            "severity": r.severity.value if hasattr(r.severity, 'value') else str(r.severity),
            "type": "risk",
            "url": f"/analysis/{doc_id}"
        })

    clauses = (
        db.query(AnalysisClause)
        .filter(
            AnalysisClause.analysis_id.in_(db.query(user_analysis_ids.c.id)),
            (
                (AnalysisClause.category.ilike(pattern)) |
                (AnalysisClause.summary_text.ilike(pattern))
            )
        )
        .limit(limit_per_type)
        .all()
    )
    clause_results = []
    for c in clauses:
        analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == c.analysis_id).first()
        doc_id = analysis.document_id if analysis else "placeholder"
        cat_val = c.category.value if hasattr(c.category, 'value') else str(c.category)
        cat_name = cat_val.replace('_', ' ').title()
        clause_results.append({
            "id": c.id,
            "title": f"{cat_name} Clause",
            "snippet": (c.summary_text[:120] + "...") if c.summary_text and len(c.summary_text) > 120 else (c.summary_text or "Clause detected"),
            "type": "clause",
            "url": f"/analysis/{doc_id}"
        })

    # 5. Reports
    reports = db.query(Report).filter(Report.generated_by == user_id).limit(limit_per_type * 2).all()
    report_results = []
    for rep in reports:
        doc = db.query(Document).filter(Document.id == rep.document_id).first()
        doc_name = (doc.original_name or doc.filename) if doc else "Report"
        rtype_label = rep.report_type.value.replace('_', ' ').title() if hasattr(rep.report_type, 'value') else str(rep.report_type)
        full_label = f"{rtype_label} — {doc_name}"
        if clean_q.lower() in full_label.lower():
            report_results.append({
                "id": rep.id,
                "title": full_label,
                "snippet": f"Status: {rep.status.value if hasattr(rep.status, 'value') else rep.status} • Generated: {rep.created_at.strftime('%Y-%m-%d') if rep.created_at else ''}",
                "type": "report",
                "url": f"/reports"
            })
            if len(report_results) >= limit_per_type:
                break

    return {
        "documents": doc_results,
        "policies": policy_results,
        "risks": risk_results,
        "clauses": clause_results,
        "reports": report_results
    }

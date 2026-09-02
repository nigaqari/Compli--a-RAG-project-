from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.session import SessionLocal
from app.models.user import User
from app.models.compliance import ComplianceResult, ComplianceFinding
from app.models.analysis import Risk, DocumentAnalysis
from app.models.document import Document
from app.models.policy import Policy
from app.schemas.compliance import ComplianceResultOut
from app.api.deps import get_current_user
from app.services.compliance_service import run_comparison, run_comparison_task

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/documents/{document_id}/compliance-check")
def trigger_compliance_check(
    document_id: str,
    policy_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify document ownership
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in your library")

    policy = db.query(Policy).filter(Policy.id == policy_id, Policy.owner_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found in your library")

    try:
        result = run_comparison(db, document_id, policy_id, current_user.id)
        if result.status == "pending":
            background_tasks.add_task(run_comparison_task, db, result.id, current_user.id)
        return {"message": "Compliance check started", "result_id": result.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/documents/{document_id}/compliance-results", response_model=List[ComplianceResultOut])
def list_compliance_results(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    results = db.query(ComplianceResult).filter(ComplianceResult.document_id == document_id).all()
    return results

@router.get("/compliance-results", response_model=List[ComplianceResultOut])
def get_all_compliance_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_doc_ids = [d.id for d in db.query(Document.id).filter(Document.owner_id == current_user.id).all()]
    if not user_doc_ids:
        return []
    return db.query(ComplianceResult).filter(ComplianceResult.document_id.in_(user_doc_ids)).order_by(ComplianceResult.created_at.desc()).all()

@router.get("/compliance-results/{result_id}", response_model=ComplianceResultOut)
def get_compliance_result(
    result_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(ComplianceResult).filter(ComplianceResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    doc = db.query(Document).filter(Document.id == result.document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Not authorized to view this result")
    return result

@router.get("/risk-center", response_model=List[Dict[str, Any]])
def get_risk_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unified view of Document Risks and Compliance Gaps strictly for the current user.
    """
    unified_risks = []
    
    # 1. Document Risks
    user_analyses = (
        db.query(DocumentAnalysis)
        .join(Document, DocumentAnalysis.document_id == Document.id)
        .filter(Document.owner_id == current_user.id)
        .all()
    )
    user_analysis_ids = [a.id for a in user_analyses]
    
    if user_analysis_ids:
        doc_risks = db.query(Risk).filter(Risk.analysis_id.in_(user_analysis_ids)).all()
        for r in doc_risks:
            analysis = next((a for a in user_analyses if a.id == r.analysis_id), None)
            doc = db.query(Document).filter(Document.id == analysis.document_id).first() if analysis else None
            doc_name = (doc.original_name or doc.filename) if doc else "Document"
            doc_id = doc.id if doc else ""
            sev = r.severity.value if hasattr(r.severity, 'value') else str(r.severity).lower()
            
            unified_risks.append({
                "id": r.id,
                "severity": sev,
                "title": r.title,
                "description": r.rationale,
                "source_type": "document_risk",
                "document_name": doc_name,
                "document_id": doc_id,
                "policy_name": None,
                "page_number": r.page_number
            })

    # 2. Compliance Findings
    user_doc_ids = [d.id for d in db.query(Document.id).filter(Document.owner_id == current_user.id).all()]
    user_results = db.query(ComplianceResult).filter(ComplianceResult.document_id.in_(user_doc_ids)).all() if user_doc_ids else []
        
    user_result_ids = [res.id for res in user_results]
    
    if user_result_ids:
        findings = db.query(ComplianceFinding).filter(ComplianceFinding.compliance_result_id.in_(user_result_ids)).all()
        for f in findings:
            res = next((r for r in user_results if r.id == f.compliance_result_id), None)
            doc = db.query(Document).filter(Document.id == res.document_id).first() if res else None
            policy = db.query(Policy).filter(Policy.id == res.policy_id).first() if res else None
            sev = f.severity.value if hasattr(f.severity, 'value') else str(f.severity).lower()
            ftype = f.finding_type.value if hasattr(f.finding_type, 'value') else str(f.finding_type)
            
            unified_risks.append({
                "id": f.id,
                "severity": sev,
                "title": ftype.replace("_", " ").title(),
                "description": f.description,
                "source_type": "compliance_gap",
                "document_name": (doc.original_name or doc.filename) if doc else "Document",
                "document_id": doc.id if doc else "",
                "policy_name": policy.name if policy else "Policy",
                "page_number": f.page_number
            })

    # Sort by severity (high > medium > low)
    severity_order = {"high": 1, "medium": 2, "low": 3}
    unified_risks.sort(key=lambda x: (severity_order.get(x["severity"], 4), x.get("id")))

    return unified_risks

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.analysis import DocumentAnalysis, AnalysisClause, Risk, Recommendation
from app.models.compliance import ComplianceResult, ComplianceFinding, ComplianceSuggestion
from app.models.policy import Policy, PolicyVersion

def assemble_executive_summary_data(db: Session, document_id: str) -> Dict[str, Any]:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    analysis = (
        db.query(DocumentAnalysis)
        .filter(DocumentAnalysis.document_id == document_id, DocumentAnalysis.status == "completed")
        .order_by(DocumentAnalysis.created_at.desc())
        .first()
    )

    top_risks = []
    key_parties = []
    summary = "No analysis completed yet."
    compliance_score = None

    if analysis:
        summary = analysis.executive_summary or "No executive summary available."
        key_parties = analysis.key_parties or []
        compliance_score = analysis.compliance_score
        
        # Sort risks: high > medium > low
        severity_order = {"high": 1, "medium": 2, "low": 3}
        sorted_risks = sorted(analysis.risks, key=lambda r: severity_order.get(r.severity.value if hasattr(r.severity, 'value') else r.severity, 4))
        top_risks = [
            {
                "title": r.title,
                "severity": r.severity.value if hasattr(r.severity, 'value') else str(r.severity),
                "rationale": r.rationale,
                "page_number": r.page_number
            }
            for r in sorted_risks[:5]
        ]

    return {
        "document_id": doc.id,
        "document_name": doc.original_name or doc.filename,
        "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
        "page_count": doc.page_count,
        "uploaded_at": doc.uploaded_at.strftime("%Y-%m-%d %H:%M UTC") if doc.uploaded_at else "N/A",
        "executive_summary": summary,
        "key_parties": key_parties,
        "top_risks": top_risks,
        "compliance_score": compliance_score
    }

def assemble_compliance_report_data(db: Session, document_id: str, compliance_result_id: Optional[str] = None) -> Dict[str, Any]:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    query = db.query(ComplianceResult).filter(ComplianceResult.document_id == document_id)
    if compliance_result_id:
        result = query.filter(ComplianceResult.id == compliance_result_id).first()
    else:
        result = query.filter(ComplianceResult.status == "completed").order_by(ComplianceResult.created_at.desc()).first()

    if not result:
        raise ValueError("No completed compliance evaluation found for this document.")

    policy = db.query(Policy).filter(Policy.id == result.policy_id).first()
    version = db.query(PolicyVersion).filter(PolicyVersion.id == result.policy_version_id).first()

    findings_by_type = {
        "missing_clause": [],
        "weak_clause": [],
        "conflicting_clause": [],
        "policy_violation": []
    }

    for f in result.findings:
        ftype = f.finding_type.value if hasattr(f.finding_type, 'value') else str(f.finding_type)
        if ftype in findings_by_type:
            findings_by_type[ftype].append({
                "category": f.category,
                "description": f.description,
                "severity": f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                "page_number": f.page_number,
                "policy_requirement": f.policy_requirement.requirement_text if f.policy_requirement else None
            })

    suggestions = [s.text for s in result.suggestions]

    return {
        "document_id": doc.id,
        "document_name": doc.original_name or doc.filename,
        "policy_name": policy.name if policy else "Unknown Policy",
        "policy_category": policy.category.value if policy and hasattr(policy.category, 'value') else "N/A",
        "policy_version": version.version_number if version else 1,
        "compliance_score": result.compliance_score if result.compliance_score is not None else 100.0,
        "risk_score": result.risk_score if result.risk_score is not None else 0.0,
        "status": result.status.value if hasattr(result.status, 'value') else str(result.status),
        "evaluated_at": result.completed_at.strftime("%Y-%m-%d %H:%M UTC") if result.completed_at else "N/A",
        "findings_by_type": findings_by_type,
        "total_findings": len(result.findings),
        "suggestions": suggestions
    }

def assemble_risk_assessment_data(db: Session, document_id: str) -> Dict[str, Any]:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    analysis = (
        db.query(DocumentAnalysis)
        .filter(DocumentAnalysis.document_id == document_id, DocumentAnalysis.status == "completed")
        .order_by(DocumentAnalysis.created_at.desc())
        .first()
    )

    risks_list = []
    high_count = 0
    med_count = 0
    low_count = 0

    if analysis:
        for r in analysis.risks:
            sev = r.severity.value if hasattr(r.severity, 'value') else str(r.severity).lower()
            if sev == "high":
                high_count += 1
            elif sev == "medium":
                med_count += 1
            else:
                low_count += 1

            risks_list.append({
                "title": r.title,
                "severity": sev,
                "rationale": r.rationale,
                "page_number": r.page_number
            })

    # Severity sort
    severity_order = {"high": 1, "medium": 2, "low": 3}
    risks_list.sort(key=lambda r: severity_order.get(r["severity"], 4))

    return {
        "document_id": doc.id,
        "document_name": doc.original_name or doc.filename,
        "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
        "total_risks": len(risks_list),
        "high_risks": high_count,
        "medium_risks": med_count,
        "low_risks": low_count,
        "risks": risks_list
    }

def assemble_complete_analysis_data(db: Session, document_id: str) -> Dict[str, Any]:
    exec_data = assemble_executive_summary_data(db, document_id)
    risk_data = assemble_risk_assessment_data(db, document_id)

    # Fetch all clauses
    analysis = (
        db.query(DocumentAnalysis)
        .filter(DocumentAnalysis.document_id == document_id, DocumentAnalysis.status == "completed")
        .order_by(DocumentAnalysis.created_at.desc())
        .first()
    )

    clauses = []
    recommendations = []
    if analysis:
        for c in analysis.clauses:
            clauses.append({
                "category": c.category,
                "found": c.found,
                "summary": c.summary_text,
                "page_number": c.page_number
            })
        for r in analysis.recommendations:
            recommendations.append(r.text)

    # Optional compliance data
    compliance_data = None
    try:
        compliance_data = assemble_compliance_report_data(db, document_id)
    except Exception:
        pass

    return {
        "executive": exec_data,
        "risks": risk_data,
        "clauses": clauses,
        "recommendations": recommendations,
        "compliance": compliance_data
    }

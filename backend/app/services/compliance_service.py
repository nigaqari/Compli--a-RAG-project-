import json
import logging
import traceback
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.policy import Policy, PolicyVersion, PolicyRequirement
from app.models.analysis import DocumentAnalysis, AnalysisClause
from app.models.compliance import ComplianceResult, ComplianceStatus, ComplianceFinding, ComplianceSuggestion
from app.services.llm_service import generate_completion, DEEP_ANALYSIS_MODEL
from app.schemas.compliance import ExtractedComplianceComparison
from app.services.scoring_service import calculate_scores
from app.services.suggestion_service import generate_suggestions
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def load_prompt(filename: str) -> str:
    with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
        return f.read()

def run_comparison_task(db: Session, result_id: str, user_id: str):
    result = db.query(ComplianceResult).filter(ComplianceResult.id == result_id).first()
    if not result:
        logger.error(f"ComplianceResult {result_id} not found.")
        return

    try:
        result.status = ComplianceStatus.comparing
        db.commit()

        # 1. Fetch Contract Clauses
        analysis = db.query(DocumentAnalysis).filter(
            DocumentAnalysis.document_id == result.document_id,
            DocumentAnalysis.status == "completed"
        ).first()
        
        if not analysis:
            raise ValueError("Document analysis must be completed before running compliance check.")
            
        clauses = db.query(AnalysisClause).filter(AnalysisClause.analysis_id == analysis.id).all()
        contract_clauses_data = []
        for c in clauses:
            cat_val = c.category.value if hasattr(c.category, 'value') else str(c.category)
            contract_clauses_data.append({
                "category": cat_val,
                "summary": c.summary_text or "",
                "found": c.found,
                "source_chunk_id": c.source_chunk_id,
                "page": c.page_number
            })

        # 2. Fetch Policy Requirements
        requirements = db.query(PolicyRequirement).filter(
            PolicyRequirement.policy_version_id == result.policy_version_id
        ).all()
        
        if not requirements:
            raise ValueError("The selected policy version has no extracted requirements.")
            
        policy_requirements_data = []
        for r in requirements:
            policy_requirements_data.append({
                "id": r.id,
                "category": r.category,
                "requirement_text": r.requirement_text,
                "mandatory": r.mandatory
            })

        # 3. LLM Comparison
        prompt_template = load_prompt("compliance_comparison.txt")
        prompt = prompt_template.replace("{{contract_clauses}}", json.dumps(contract_clauses_data, indent=2))
        prompt = prompt.replace("{{policy_requirements}}", json.dumps(policy_requirements_data, indent=2))

        messages = [
            {"role": "system", "content": "You are a helpful legal AI assistant. Output JSON."},
            {"role": "user", "content": prompt}
        ]

        def _call_llm_and_parse(msgs):
            content = generate_completion(
                db=db,
                user_id=user_id,
                messages=msgs,
                temperature=0.2,
                max_tokens=4000,
                response_format={"type": "json_object"},
                model=DEEP_ANALYSIS_MODEL
            )
            data = json.loads(content)
            return ExtractedComplianceComparison(**data)

        try:
            extracted = _call_llm_and_parse(messages)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning(f"Failed to parse comparison JSON, retrying once. Error: {str(e)}")
            messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
            messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON."})
            extracted = _call_llm_and_parse(messages)

        # 4. Save findings
        for f in extracted.findings:
            finding = ComplianceFinding(
                compliance_result_id=result.id,
                finding_type=f.finding_type,
                category=f.category,
                description=f.description,
                severity=f.severity,
                policy_requirement_id=f.policy_requirement_id,
                contract_source_chunk_id=f.contract_source_chunk_id,
                page_number=f.page_number
            )
            db.add(finding)
        db.commit()
        
        # 5. Calculate Scores
        compliance_score, risk_score = calculate_scores(result)
        result.compliance_score = compliance_score
        result.risk_score = risk_score
        
        # 6. Generate Suggestions
        suggestions = generate_suggestions(db, user_id, result)
        for s in suggestions:
            db.add(s)

        # 7. Complete
        result.status = ComplianceStatus.completed
        result.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error in compliance check: {str(e)}")
        logger.error(traceback.format_exc())
        result.status = ComplianceStatus.failed
        result.error = str(e)
        db.commit()

def run_comparison(db: Session, document_id: str, policy_id: str, current_user_id: str) -> ComplianceResult:
    # Validate Document
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ValueError("Document not found.")

    analysis = db.query(DocumentAnalysis).filter(
        DocumentAnalysis.document_id == document_id,
        DocumentAnalysis.status == "completed"
    ).first()
    
    if not analysis:
        raise ValueError("Run document analysis before checking compliance.")

    # Validate Policy
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise ValueError("Policy not found.")

    version = db.query(PolicyVersion).filter(
        PolicyVersion.policy_id == policy_id,
        PolicyVersion.version_number == policy.current_version
    ).first()
    
    if not version:
        raise ValueError("Current policy version not found.")

    # Check if a pending/completed result already exists for THIS version
    existing = db.query(ComplianceResult).filter(
        ComplianceResult.document_id == document_id,
        ComplianceResult.policy_version_id == version.id
    ).first()
    
    if existing:
        # Reprocess: Delete old findings, reset to pending
        db.query(ComplianceFinding).filter(ComplianceFinding.compliance_result_id == existing.id).delete()
        db.query(ComplianceSuggestion).filter(ComplianceSuggestion.compliance_result_id == existing.id).delete()
        existing.status = ComplianceStatus.pending
        existing.error = None
        existing.compliance_score = None
        existing.risk_score = None
        existing.completed_at = None
        db.commit()
        return existing

    result = ComplianceResult(
        document_id=document_id,
        policy_id=policy_id,
        policy_version_id=version.id,
        status=ComplianceStatus.pending
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    
    return result

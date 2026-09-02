import json
import logging
from sqlalchemy.orm import Session
from app.services.llm_service import generate_completion
from app.schemas.compliance import ExtractedComplianceSuggestions
from app.models.compliance import ComplianceResult, ComplianceFinding, ComplianceSuggestion
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def load_prompt(filename: str) -> str:
    with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
        return f.read()

def generate_suggestions(db: Session, user_id: str, result: ComplianceResult) -> list[ComplianceSuggestion]:
    if not result.findings:
        return []

    prompt_template = load_prompt("compliance_suggestions.txt")
    
    findings_list = []
    for f in result.findings:
        findings_list.append({
            "id": f.id,
            "type": f.finding_type,
            "category": f.category,
            "description": f.description,
            "severity": f.severity
        })
    
    prompt = prompt_template.replace("{{compliance_findings}}", json.dumps(findings_list, indent=2))
    
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
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        data = json.loads(content)
        return ExtractedComplianceSuggestions(**data)

    try:
        extracted = _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse suggestions JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON."})
        extracted = _call_llm_and_parse(messages)

    suggestions = []
    for sugg in extracted.suggestions:
        # Verify finding_id is valid
        finding_id = sugg.finding_id
        if finding_id and not any(f.id == finding_id for f in result.findings):
            finding_id = None
            
        s = ComplianceSuggestion(
            compliance_result_id=result.id,
            finding_id=finding_id,
            text=sugg.text
        )
        suggestions.append(s)
        
    return suggestions

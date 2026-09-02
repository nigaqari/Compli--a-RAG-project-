import json
import logging
from sqlalchemy.orm import Session
from app.services.llm_service import generate_completion, DEEP_ANALYSIS_MODEL
from app.schemas.analysis import ExtractedAnalysis, ExtractedRiskAnalysis
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def load_prompt(filename: str) -> str:
    with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
        return f.read()

def run_risk_analysis(db: Session, user_id: str, extracted: ExtractedAnalysis) -> ExtractedRiskAnalysis:
    prompt_template = load_prompt("risk_analysis.txt")
    
    # We only feed the found clauses to the risk model, reducing context significantly
    found_clauses = {k: v.model_dump() for k, v in extracted.clauses.items() if v.found}
    clauses_json = json.dumps(found_clauses, indent=2)
    
    prompt = prompt_template.replace("{{extracted_clauses}}", clauses_json)
    
    messages = [
        {"role": "system", "content": "You are a helpful legal AI assistant. Output JSON."},
        {"role": "user", "content": prompt}
    ]
    
    def _call_llm_and_parse(msgs):
        content = generate_completion(
            db=db,
            user_id=user_id,
            messages=msgs,
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"},
            model=DEEP_ANALYSIS_MODEL
        )
        data = json.loads(content)
        return ExtractedRiskAnalysis(**data)

    try:
        return _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse risk JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON matching the schema."})
        return _call_llm_and_parse(messages)

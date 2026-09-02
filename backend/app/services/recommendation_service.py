import json
import logging
from sqlalchemy.orm import Session
from app.services.llm_service import generate_completion
from app.schemas.analysis import ExtractedAnalysis, ExtractedRiskAnalysis, ExtractedRecommendationAnalysis
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def load_prompt(filename: str) -> str:
    with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
        return f.read()

def run_recommendations(db: Session, user_id: str, extracted: ExtractedAnalysis, risks: ExtractedRiskAnalysis) -> ExtractedRecommendationAnalysis:
    prompt_template = load_prompt("recommendations.txt")
    
    found_clauses = {k: v.model_dump() for k, v in extracted.clauses.items()}
    context_data = {
        "clauses": found_clauses,
        "risks": [r.model_dump() for r in risks.risks]
    }
    context_json = json.dumps(context_data, indent=2)
    
    prompt = prompt_template.replace("{{clauses_and_risks}}", context_json)
    
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
            response_format={"type": "json_object"}
        )
        data = json.loads(content)
        return ExtractedRecommendationAnalysis(**data)

    try:
        return _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse recommendations JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON matching the schema."})
        return _call_llm_and_parse(messages)

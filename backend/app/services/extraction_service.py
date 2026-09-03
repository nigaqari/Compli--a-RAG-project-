import json
import logging
from sqlalchemy.orm import Session
from app.services.analysis_context import assemble_document_context
from app.services.llm_service import generate_completion, DEEP_ANALYSIS_MODEL
from app.schemas.analysis import ExtractedAnalysis
from pydantic import ValidationError

logger = logging.getLogger(__name__)

import os

def load_prompt(filename: str) -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    possible_paths = [
        os.path.join(base_dir, "prompts", filename),
        os.path.join(os.getcwd(), "prompts", filename),
        os.path.join(os.getcwd(), "backend", "prompts", filename),
        os.path.join(os.getcwd(), "compli", "backend", "prompts", filename)
    ]
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
    raise FileNotFoundError(f"Prompt {filename} not found")

def _extract_single(db: Session, user_id: str, context: str) -> ExtractedAnalysis:
    prompt_template = load_prompt("analysis_extraction.txt")
    prompt = prompt_template.replace("{{document_text}}", context)
    
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
            max_tokens=4000,
            response_format={"type": "json_object"},
            model=DEEP_ANALYSIS_MODEL
        )
        data = json.loads(content)
        return ExtractedAnalysis(**data)

    try:
        return _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse extraction JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON matching the schema."})
        return _call_llm_and_parse(messages)

def _reduce_extractions(db: Session, user_id: str, partials: list[ExtractedAnalysis]) -> ExtractedAnalysis:
    prompt_template = load_prompt("analysis_reduce.txt")
    
    partials_json = json.dumps([p.model_dump() for p in partials], indent=2)
    prompt = prompt_template.replace("{{partial_extractions}}", partials_json)
    
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
            max_tokens=4000,
            response_format={"type": "json_object"},
            model=DEEP_ANALYSIS_MODEL
        )
        data = json.loads(content)
        return ExtractedAnalysis(**data)

    try:
        return _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse reduce JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON matching the schema."})
        return _call_llm_and_parse(messages)

def run_extraction(db: Session, user_id: str, document_id: str) -> ExtractedAnalysis:
    is_single, contexts = assemble_document_context(db, document_id)
    
    if is_single:
        return _extract_single(db, user_id, contexts[0])
    
    # Map-reduce
    partials = []
    for ctx in contexts:
        partial = _extract_single(db, user_id, ctx)
        partials.append(partial)
        
    return _reduce_extractions(db, user_id, partials)

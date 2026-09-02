import json
import logging
from sqlalchemy.orm import Session
from app.services.analysis_context import assemble_document_context
from app.services.llm_service import generate_completion
from app.schemas.policy import ExtractedPolicyRequirementsList
from app.models.policy import PolicyVersion, PolicyRequirement
from pydantic import ValidationError

logger = logging.getLogger(__name__)

def load_prompt(filename: str) -> str:
    with open(f"prompts/{filename}", "r", encoding="utf-8") as f:
        return f.read()

def _extract_single(db: Session, user_id: str, context: str) -> ExtractedPolicyRequirementsList:
    prompt_template = load_prompt("policy_requirement_extraction.txt")
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
            response_format={"type": "json_object"}
        )
        data = json.loads(content)
        return ExtractedPolicyRequirementsList(**data)

    try:
        return _call_llm_and_parse(messages)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.warning(f"Failed to parse policy extraction JSON, retrying once. Error: {str(e)}")
        messages.append({"role": "assistant", "content": "Invalid JSON or schema mismatch."})
        messages.append({"role": "user", "content": "Your last response was invalid JSON or did not match the requested schema exactly. Please retry and return ONLY valid JSON matching the schema."})
        return _call_llm_and_parse(messages)

def run_policy_extraction(db: Session, user_id: str, policy_version_id: str) -> ExtractedPolicyRequirementsList:
    version = db.query(PolicyVersion).filter(PolicyVersion.id == policy_version_id).first()
    if not version or not version.document_id:
        raise ValueError("Invalid policy version or missing document_id")
        
    is_single, contexts = assemble_document_context(db, version.document_id)
    
    if is_single:
        return _extract_single(db, user_id, contexts[0])
    
    # Map-reduce: combine requirements
    all_requirements = []
    for ctx in contexts:
        partial = _extract_single(db, user_id, ctx)
        all_requirements.extend(partial.requirements)
        
    return ExtractedPolicyRequirementsList(requirements=all_requirements)

def persist_policy_requirements(db: Session, policy_version_id: str, extracted: ExtractedPolicyRequirementsList):
    version = db.query(PolicyVersion).filter(PolicyVersion.id == policy_version_id).first()
    
    for req_data in extracted.requirements:
        chunk_id = None
        if req_data.page:
            from app.services.analysis_service import _find_best_chunk
            chunk_id = _find_best_chunk(db, version.document_id, req_data.page)
            
        req = PolicyRequirement(
            policy_version_id=policy_version_id,
            category=req_data.category,
            requirement_text=req_data.requirement_text,
            mandatory=req_data.mandatory,
            source_chunk_id=chunk_id,
            page_number=req_data.page
        )
        db.add(req)
    
    db.commit()

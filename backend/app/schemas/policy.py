from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.policy import PolicyCategory, ProcessingStatus, ClauseCategory

class PolicyRequirementOut(BaseModel):
    id: str
    category: str
    requirement_text: str
    mandatory: bool
    source_chunk_id: Optional[str] = None
    page_number: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes = True

class PolicyVersionOut(BaseModel):
    id: str
    version_number: int
    uploaded_by: str
    change_note: Optional[str]
    processing_status: ProcessingStatus
    processing_error: Optional[str]
    created_at: datetime
    requirements: List[PolicyRequirementOut] = []

    class Config:
        orm_mode = True
        from_attributes = True

class PolicyOut(BaseModel):
    id: str
    name: str
    category: PolicyCategory
    owner_id: str
    current_version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Internal schema for LLM extraction
class ExtractedPolicyRequirement(BaseModel):
    category: str
    requirement_text: str
    mandatory: bool
    page: Optional[int] = None

class ExtractedPolicyRequirementsList(BaseModel):
    requirements: List[ExtractedPolicyRequirement]

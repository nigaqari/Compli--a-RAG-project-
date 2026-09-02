from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.compliance import ComplianceStatus, FindingType, RiskSeverity

class ComplianceSuggestionOut(BaseModel):
    id: str
    text: str
    finding_id: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True

class ComplianceFindingOut(BaseModel):
    id: str
    finding_type: FindingType
    category: str
    description: str
    severity: RiskSeverity
    policy_requirement_id: Optional[str]
    contract_source_chunk_id: Optional[str]
    page_number: Optional[int]

    class Config:
        orm_mode = True
        from_attributes = True

class ComplianceResultOut(BaseModel):
    id: str
    document_id: str
    policy_id: str
    policy_version_id: str
    status: ComplianceStatus
    compliance_score: Optional[float]
    risk_score: Optional[float]
    error: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    findings: List[ComplianceFindingOut] = []
    suggestions: List[ComplianceSuggestionOut] = []

    class Config:
        orm_mode = True
        from_attributes = True

# Internal schema for LLM comparison
class ExtractedComplianceFinding(BaseModel):
    finding_type: str
    category: str
    description: str
    severity: str
    policy_requirement_id: Optional[str]
    contract_source_chunk_id: Optional[str]
    page_number: Optional[int]

class ExtractedComplianceComparison(BaseModel):
    findings: List[ExtractedComplianceFinding]

class ExtractedSuggestion(BaseModel):
    text: str
    finding_id: Optional[str]

class ExtractedComplianceSuggestions(BaseModel):
    suggestions: List[ExtractedSuggestion]

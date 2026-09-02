from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from app.models.analysis import AnalysisStatus, ClauseCategory, RiskSeverity

# ---------------------------------------------------------
# Internal Extraction Schemas (for validating LLM JSON output)
# ---------------------------------------------------------

class ExtractedParty(BaseModel):
    name: str
    role: str

class ExtractedClauseDetails(BaseModel):
    found: bool
    summary: Optional[str] = None
    page: Optional[int] = None

class ExtractedAnalysis(BaseModel):
    executive_summary: str
    key_parties: List[ExtractedParty]
    clauses: Dict[str, ExtractedClauseDetails]  # keys should match ClauseCategory

class ExtractedRisk(BaseModel):
    severity: RiskSeverity
    title: str
    rationale: str
    related_category: Optional[str] = None
    page: Optional[int] = None

class ExtractedRiskAnalysis(BaseModel):
    risks: List[ExtractedRisk]

class ExtractedRecommendation(BaseModel):
    text: str
    related_risk_title: Optional[str] = None

class ExtractedRecommendationAnalysis(BaseModel):
    recommendations: List[ExtractedRecommendation]


# ---------------------------------------------------------
# API Output Schemas (for returning to frontend)
# ---------------------------------------------------------

class ClauseOut(BaseModel):
    id: str
    category: ClauseCategory
    found: bool
    summary_text: Optional[str]
    source_chunk_id: Optional[str]
    page_number: Optional[int]

    class Config:
        orm_mode = True
        from_attributes = True

class RecommendationOut(BaseModel):
    id: str
    text: str
    related_risk_id: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True

class RiskOut(BaseModel):
    id: str
    severity: RiskSeverity
    title: str
    rationale: str
    source_chunk_id: Optional[str]
    page_number: Optional[int]
    recommendations: List[RecommendationOut] = []

    class Config:
        orm_mode = True
        from_attributes = True

class AnalysisOut(BaseModel):
    id: str
    document_id: str
    status: AnalysisStatus
    executive_summary: Optional[str]
    key_parties: Optional[List[Dict[str, str]]]
    compliance_score: Optional[int]
    error: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    clauses: List[ClauseOut] = []
    risks: List[RiskOut] = []
    recommendations: List[RecommendationOut] = []

    class Config:
        orm_mode = True
        from_attributes = True

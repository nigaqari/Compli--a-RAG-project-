from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.report import ReportType, ReportStatus

class ReportCreate(BaseModel):
    document_id: str
    report_type: ReportType

class ReportOut(BaseModel):
    id: str
    document_id: str
    document_name: Optional[str] = None
    generated_by: str
    report_type: ReportType
    status: ReportStatus
    file_path: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportStatusOut(BaseModel):
    id: str
    status: ReportStatus
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

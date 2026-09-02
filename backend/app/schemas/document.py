from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.document import DocumentType, DocumentStatus

class DocumentBase(BaseModel):
    filename: str
    original_name: str
    document_type: DocumentType
    status: Optional[DocumentStatus] = DocumentStatus.pending
    compliance_score: Optional[float] = None

class DocumentCreate(DocumentBase):
    file_path: str
    owner_id: str

class DocumentUpdate(BaseModel):
    filename: Optional[str] = None
    document_type: Optional[DocumentType] = None
    status: Optional[DocumentStatus] = None
    compliance_score: Optional[float] = None

class DocumentOut(DocumentBase):
    id: str
    owner_id: str
    uploaded_at: datetime
    updated_at: datetime
    # Omitting file_path for security, can include if needed

    class Config:
        from_attributes = True

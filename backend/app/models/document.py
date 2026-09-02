from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class DocumentType(str, enum.Enum):
    contract = "contract"
    policy = "policy"
    nda = "nda"
    sla = "sla"

class DocumentStatus(str, enum.Enum):
    pending = "pending"
    analyzed = "analyzed"
    flagged = "flagged"

class ProcessingStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.pending, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    compliance_score = Column(Float, nullable=True)
    
    # Week 3 Processing Pipeline Metadata
    file_hash = Column(String, nullable=True)
    page_count = Column(Integer, nullable=True)
    pdf_title = Column(String, nullable=True)
    pdf_author = Column(String, nullable=True)
    is_encrypted = Column(Boolean, nullable=True)
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.uploaded, nullable=False)
    processing_error = Column(String, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="documents")
    reports = relationship("Report", back_populates="document")
    chat_history = relationship("ChatHistory", back_populates="document_scope")

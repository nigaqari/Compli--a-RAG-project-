from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class PolicyCategory(str, enum.Enum):
    data_privacy = "data_privacy"
    vendor = "vendor"
    hr = "hr"
    security = "security"

class ProcessingStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class ClauseCategory(str, enum.Enum):
    payment_terms = "payment_terms"
    confidentiality = "confidentiality"
    data_protection = "data_protection"
    liability = "liability"
    termination = "termination"
    dispute_resolution = "dispute_resolution"
    vendor_obligation = "vendor_obligation"
    important_clause = "important_clause"

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    category = Column(Enum(PolicyCategory), nullable=False)
    file_path = Column(String, nullable=False)  # This could point to the current version's file
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    current_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="policies")
    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")


class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    change_note = Column(String, nullable=True)
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.uploaded, nullable=False)
    processing_error = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)

    policy = relationship("Policy", back_populates="versions")
    document = relationship("Document")
    uploader = relationship("User")
    requirements = relationship("PolicyRequirement", back_populates="version", cascade="all, delete-orphan")


class PolicyRequirement(Base):
    __tablename__ = "policy_requirements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_version_id = Column(String, ForeignKey("policy_versions.id"), nullable=False)
    category = Column(String, nullable=False)
    requirement_text = Column(String, nullable=False)
    mandatory = Column(Boolean, default=False, nullable=False)
    source_chunk_id = Column(String, ForeignKey("document_chunks.id"), nullable=True)
    page_number = Column(Integer, nullable=True)

    version = relationship("PolicyVersion", back_populates="requirements")

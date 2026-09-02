from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
import enum
import uuid

from app.models.document import Base

class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    analyzing = "analyzing"
    completed = "completed"
    failed = "failed"

class ClauseCategory(str, enum.Enum):
    important_clause = "important_clause"
    vendor_obligation = "vendor_obligation"
    payment_terms = "payment_terms"
    termination = "termination"
    confidentiality = "confidentiality"
    data_protection = "data_protection"
    liability = "liability"
    dispute_resolution = "dispute_resolution"

class RiskSeverity(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class DocumentAnalysis(Base):
    __tablename__ = "document_analysis"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.pending, nullable=False)
    
    executive_summary = Column(String, nullable=True)
    key_parties = Column(JSON, nullable=True)  # [{"name": "...", "role": "..."}]
    compliance_score = Column(Integer, nullable=True)
    error = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    document = relationship("Document", backref="analyses")
    clauses = relationship("AnalysisClause", back_populates="analysis", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="analysis", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="analysis", cascade="all, delete-orphan")


class AnalysisClause(Base):
    __tablename__ = "analysis_clauses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("document_analysis.id", ondelete="CASCADE"), nullable=False)
    
    category = Column(Enum(ClauseCategory), nullable=False)
    found = Column(Boolean, default=False, nullable=False)
    summary_text = Column(String, nullable=True)
    source_chunk_id = Column(String, ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, nullable=True)
    
    # Relationships
    analysis = relationship("DocumentAnalysis", back_populates="clauses")
    source_chunk = relationship("DocumentChunk")


class Risk(Base):
    __tablename__ = "risks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("document_analysis.id", ondelete="CASCADE"), nullable=False)
    
    severity = Column(Enum(RiskSeverity), nullable=False)
    title = Column(String, nullable=False)
    rationale = Column(String, nullable=False)
    source_chunk_id = Column(String, ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, nullable=True)
    
    # Relationships
    analysis = relationship("DocumentAnalysis", back_populates="risks")
    source_chunk = relationship("DocumentChunk")
    recommendations = relationship("Recommendation", back_populates="related_risk")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String, ForeignKey("document_analysis.id", ondelete="CASCADE"), nullable=False)
    related_risk_id = Column(String, ForeignKey("risks.id", ondelete="SET NULL"), nullable=True)
    
    text = Column(String, nullable=False)
    
    # Relationships
    analysis = relationship("DocumentAnalysis", back_populates="recommendations")
    related_risk = relationship("Risk", back_populates="recommendations")

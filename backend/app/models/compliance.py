from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class ComplianceStatus(str, enum.Enum):
    pending = "pending"
    comparing = "comparing"
    completed = "completed"
    failed = "failed"

class FindingType(str, enum.Enum):
    missing_clause = "missing_clause"
    weak_clause = "weak_clause"
    conflicting_clause = "conflicting_clause"
    policy_violation = "policy_violation"

class RiskSeverity(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False)
    policy_version_id = Column(String, ForeignKey("policy_versions.id"), nullable=False)
    status = Column(Enum(ComplianceStatus), default=ComplianceStatus.pending, nullable=False)
    compliance_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    error = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("Document")
    policy = relationship("Policy")
    policy_version = relationship("PolicyVersion")
    findings = relationship("ComplianceFinding", back_populates="result", cascade="all, delete-orphan")
    suggestions = relationship("ComplianceSuggestion", back_populates="result", cascade="all, delete-orphan")


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    compliance_result_id = Column(String, ForeignKey("compliance_results.id"), nullable=False)
    finding_type = Column(Enum(FindingType), nullable=False)
    category = Column(String, nullable=False) # e.g. data_protection
    description = Column(String, nullable=False)
    severity = Column(Enum(RiskSeverity), nullable=False)
    policy_requirement_id = Column(String, ForeignKey("policy_requirements.id"), nullable=True)
    contract_source_chunk_id = Column(String, ForeignKey("document_chunks.id"), nullable=True)
    page_number = Column(Integer, nullable=True)

    result = relationship("ComplianceResult", back_populates="findings")
    policy_requirement = relationship("PolicyRequirement")


class ComplianceSuggestion(Base):
    __tablename__ = "compliance_suggestions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    compliance_result_id = Column(String, ForeignKey("compliance_results.id"), nullable=False)
    finding_id = Column(String, ForeignKey("compliance_findings.id"), nullable=True)
    text = Column(String, nullable=False)

    result = relationship("ComplianceResult", back_populates="suggestions")
    finding = relationship("ComplianceFinding")

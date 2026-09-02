from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class ReportType(str, enum.Enum):
    executive_summary = "executive_summary"
    compliance = "compliance"
    risk_assessment = "risk_assessment"
    complete_analysis = "complete_analysis"
    # Legacy aliases
    full = "full"
    risk = "risk"

class ReportStatus(str, enum.Enum):
    pending = "pending"
    generating = "generating"
    completed = "completed"
    failed = "failed"

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    generated_by = Column(String, ForeignKey("users.id"), nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending, nullable=False)
    file_path = Column(String, nullable=True)
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("Document", back_populates="reports")
    generated_by_user = relationship("User", back_populates="reports")

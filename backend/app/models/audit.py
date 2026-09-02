from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class AuditAction(str, enum.Enum):
    upload = "upload"
    query = "query"
    report = "report"
    delete = "delete"
    login = "login"
    logout = "logout"
    update = "update"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(Enum(AuditAction), nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")

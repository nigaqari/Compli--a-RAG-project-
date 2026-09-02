from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class UserRole(str, enum.Enum):
    reviewer = "reviewer"
    employee = "employee"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    documents = relationship("Document", back_populates="owner")
    policies = relationship("Policy", back_populates="owner")
    reports = relationship("Report", back_populates="generated_by_user")
    conversations = relationship("Conversation", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    settings_updated = relationship("ApplicationSetting", back_populates="updated_by_user")
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")


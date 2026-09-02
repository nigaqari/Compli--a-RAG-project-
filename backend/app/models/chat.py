from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.dialects.sqlite import JSON
import uuid
import enum
from datetime import datetime, timezone
from app.db.base import Base

class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    document_scope_id = Column(String, ForeignKey("documents.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="conversations")
    document_scope = relationship("Document")
    messages = relationship("ChatHistory", back_populates="conversation", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ChatRole), nullable=False)
    content = Column(String, nullable=False)
    document_scope_id = Column(String, ForeignKey("documents.id"), nullable=True)
    citations = Column(MutableList.as_mutable(JSON), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    conversation = relationship("Conversation", back_populates="messages")
    document_scope = relationship("Document")

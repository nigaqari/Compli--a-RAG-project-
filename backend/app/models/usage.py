from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
import uuid
from datetime import datetime, timezone
from app.db.base import Base

class LLMUsage(Base):
    __tablename__ = "llm_usage"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String, nullable=False)
    model = Column(String, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

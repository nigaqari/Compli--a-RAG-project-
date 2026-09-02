from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.db.session import SessionLocal
from app.models.user import User
from app.api.deps import get_current_user
from app.services.search_service import global_search

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=Dict[str, List[Dict[str, Any]]])
def search(
    q: str = Query("", description="Keyword search query string"),
    limit: int = Query(5, description="Max results per entity category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unified global search endpoint querying Documents, Policies, Risks, Clauses, and Reports scoped to user."""
    return global_search(db, query=q, user_id=current_user.id, limit_per_type=limit)

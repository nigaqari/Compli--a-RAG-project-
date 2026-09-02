from fastapi import APIRouter

from app.api.v1.endpoints import auth
from app.api.v1.endpoints import documents
from app.api.v1.endpoints import chat
from app.api.v1.endpoints import analysis
from app.api.v1.endpoints import dashboard
from app.api.v1.endpoints import policies
from app.api.v1.endpoints import compliance
from app.api.v1.endpoints import reports
from app.api.v1.endpoints import search

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(policies.router, prefix="/policies", tags=["policies"])
api_router.include_router(compliance.router, tags=["compliance"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(search.router, prefix="/search", tags=["search"])

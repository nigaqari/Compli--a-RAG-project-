from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Import all SQLAlchemy models to ensure registration in Base.metadata
from app.models.user import User
from app.models.otp import OTPCode
from app.models.document import Document
from app.models.policy import Policy
from app.models.analysis import DocumentAnalysis, AnalysisClause, Risk
from app.models.compliance import ComplianceResult, ComplianceFinding
from app.models.report import Report
from app.models.audit import AuditLog

# Auto-create all DB tables on server initialization
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Compli API",
    version="1.0"
)

# Enable CORS for all production and local origins (Vercel, Render, local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to Compli Legal & Governance RAG API Server",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

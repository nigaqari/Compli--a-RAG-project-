from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

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

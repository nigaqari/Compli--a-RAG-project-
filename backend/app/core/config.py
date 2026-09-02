from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./compli.db"
    JWT_SECRET_KEY: str = "compli_production_jwt_secret_key_2026_super_secure_rag"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["*"]
    ENV: str = "production"
    GROQ_API_KEY: str = ""

    # SMTP & OTP Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    status: str = "otp_required"
    requires_otp: bool = True
    pending_token: str
    masked_email: str
    email: str
    message: str

class VerifyOtpRequest(BaseModel):
    pending_token: str
    otp_code: str
    email: Optional[str] = None

class ResendOtpRequest(BaseModel):
    pending_token: Optional[str] = None
    email: Optional[str] = None

class ResendOtpResponse(BaseModel):
    pending_token: str
    masked_email: str
    message: str

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthSuccessResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ProfileUpdateRequest(BaseModel):
    full_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

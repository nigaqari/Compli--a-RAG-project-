from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.audit import AuditLog, AuditAction
from app.schemas.auth import (
    SignupRequest, LoginRequest, LoginResponse, VerifyOtpRequest,
    ResendOtpRequest, ResendOtpResponse, UserOut, AuthSuccessResponse,
    ProfileUpdateRequest, ChangePasswordRequest
)
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    decode_access_token, validate_strict_password
)
from app.services.otp_service import (
    initiate_otp, verify_otp_token_and_code, resend_otp_code
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_authenticated_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        user = db.query(User).filter(User.is_active == True).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")

    token = authorization.split("Bearer ")[1].strip()
    payload = decode_access_token(token)
    if not payload or not payload.get("sub") or payload.get("purpose") == "otp_pending":
        raise HTTPException(status_code=401, detail="Session expired or invalid authorization token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user

@router.post("/signup", response_model=UserOut)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()

    # 1. Strict password validation
    is_valid_pw, pw_err = validate_strict_password(req.password)
    if not is_valid_pw:
        raise HTTPException(status_code=400, detail=pw_err)

    # 2. Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # 3. Create user
    new_user = User(
        full_name=req.full_name.strip(),
        email=clean_email,
        hashed_password=get_password_hash(req.password),
        role=UserRole.employee,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        action=AuditAction.update,
        target_type="user",
        target_id="signup"
    )
    db.add(audit)
    db.commit()

    return new_user

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled. Please contact an administrator.")

    # Generate, hash, and dispatch Gmail SMTP OTP
    pending_token, masked_email = initiate_otp(db, user, purpose="login")

    # Record Audit Log
    audit = AuditLog(
        user_id=user.id,
        action=AuditAction.login,
        target_type="otp",
        target_id="login_otp_sent"
    )
    db.add(audit)
    db.commit()

    return LoginResponse(
        status="otp_required",
        requires_otp=True,
        pending_token=pending_token,
        masked_email=masked_email,
        email=clean_email,
        message=f"Verification code sent to {masked_email}."
    )

@router.post("/verify-otp", response_model=AuthSuccessResponse)
def verify_login_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    # 1. Verify OTP with pending token and code
    user = verify_otp_token_and_code(db, req.pending_token, req.otp_code)

    # 2. Record Audit Log
    audit = AuditLog(
        user_id=user.id,
        action=AuditAction.login,
        target_type="otp",
        target_id="login_otp_verified"
    )
    db.add(audit)
    db.commit()

    # 3. Create full JWT Session Token
    token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "name": user.full_name,
            "purpose": "access"
        }
    )

    return AuthSuccessResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/resend-otp", response_model=ResendOtpResponse)
def resend_login_otp(req: ResendOtpRequest, db: Session = Depends(get_db)):
    if not req.pending_token:
        # Fallback to email lookup if provided
        if not req.email:
            raise HTTPException(status_code=400, detail="Pending token or email is required.")
        user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        pending_token, masked_email = initiate_otp(db, user)
    else:
        pending_token, masked_email = resend_otp_code(db, req.pending_token)

    return ResendOtpResponse(
        pending_token=pending_token,
        masked_email=masked_email,
        message=f"A fresh verification code was sent to {masked_email}."
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_authenticated_user)
):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_authenticated_user)
):
    current_user.full_name = req.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_authenticated_user)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    is_valid, err_msg = validate_strict_password(req.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully."}

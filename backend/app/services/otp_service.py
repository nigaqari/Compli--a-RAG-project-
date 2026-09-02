import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.models.otp import OTPCode
from app.core.config import settings
from app.core.security import (
    generate_otp_code, hash_otp_code, verify_otp_code,
    create_pending_otp_token, decode_access_token, mask_email
)
from app.services.email_service import send_otp_email

logger = logging.getLogger(__name__)

def invalidate_existing_otps(db: Session, user_id: str, purpose: str = "login") -> None:
    """Marks any previous unconsumed OTPs for this user as consumed/invalidated."""
    db.query(OTPCode).filter(
        OTPCode.user_id == user_id,
        OTPCode.purpose == purpose,
        OTPCode.consumed == False
    ).update({"consumed": True})
    db.commit()

def initiate_otp(db: Session, user: User, purpose: str = "login") -> tuple[str, str]:
    """
    1. Invalidates old OTPs
    2. Generates secure 6-digit code
    3. Hashes code and saves to database
    4. Dispatches styled HTML email via Gmail SMTP
    5. Returns (pending_token, masked_email)
    """
    # 1. Invalidate previous codes
    invalidate_existing_otps(db, user.id, purpose)

    # 2. Generate and hash code
    code = generate_otp_code()
    hashed = hash_otp_code(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    # 3. Save to DB
    otp_record = OTPCode(
        user_id=user.id,
        otp_hash=hashed,
        purpose=purpose,
        expires_at=expires_at,
        attempt_count=0,
        consumed=False
    )
    db.add(otp_record)
    db.commit()

    # 4. Dispatch Email
    send_otp_email(user.email, code)

    # 5. Build Pending JWT Token
    pending_token = create_pending_otp_token(user.id)
    masked = mask_email(user.email)

    return pending_token, masked

def verify_otp_token_and_code(db: Session, pending_token: str, code: str) -> User:
    """
    Validates pending token, checks database OTP hash, tracks attempts,
    and returns authenticated User on success.
    """
    # 1. Validate pending token
    payload = decode_access_token(pending_token)
    if not payload or payload.get("purpose") != "otp_pending":
        raise HTTPException(
            status_code=401,
            detail="Your verification session has expired. Please sign in again."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    # 2. Fetch active OTP record
    otp_record = db.query(OTPCode).filter(
        OTPCode.user_id == user_id,
        OTPCode.purpose == "login",
        OTPCode.consumed == False
    ).order_by(OTPCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="No active verification code found. Please request a new code."
        )

    # 3. Check expiration
    now_utc = datetime.now(timezone.utc)
    record_expiry = otp_record.expires_at
    if record_expiry.tzinfo is None:
        record_expiry = record_expiry.replace(tzinfo=timezone.utc)

    if now_utc > record_expiry:
        otp_record.consumed = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code."
        )

    # 4. Check max attempts
    if otp_record.attempt_count >= settings.OTP_MAX_ATTEMPTS:
        otp_record.consumed = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Too many failed attempts. Please request a new verification code."
        )

    # 5. Verify code hash
    clean_code = code.strip()
    if not verify_otp_code(clean_code, otp_record.otp_hash):
        otp_record.attempt_count += 1
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempt_count
        if remaining <= 0:
            otp_record.consumed = True
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Too many failed attempts. Please request a new code."
            )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        )

    # 6. Success -> consume OTP
    otp_record.consumed = True
    db.commit()
    return user

def resend_otp_code(db: Session, pending_token: str) -> tuple[str, str]:
    """
    Resends OTP for user in pending token, enforcing a 30-second cooldown.
    """
    payload = decode_access_token(pending_token)
    if not payload or payload.get("purpose") != "otp_pending":
        raise HTTPException(
            status_code=401,
            detail="Your verification session has expired. Please sign in again."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Check cooldown against latest OTP created_at
    latest_otp = db.query(OTPCode).filter(
        OTPCode.user_id == user_id
    ).order_by(OTPCode.created_at.desc()).first()

    if latest_otp:
        now_utc = datetime.now(timezone.utc)
        created_at = latest_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        elapsed = (now_utc - created_at).total_seconds()
        if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
            wait_remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_remaining} seconds before requesting another code."
            )

    return initiate_otp(db, user)

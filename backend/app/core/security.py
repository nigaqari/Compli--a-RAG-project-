from datetime import datetime, timedelta, timezone
from typing import Any, Union, Dict
from jose import jwt
import bcrypt
from app.core.config import settings

def create_access_token(
    subject: Union[str, Any] = None,
    expires_delta: timedelta = None,
    data: Dict[str, Any] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire}
    if data:
        to_encode.update(data)
    elif subject:
        to_encode["sub"] = str(subject)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def decode_access_token(token: str) -> Union[dict, None]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def validate_strict_password(password: str) -> tuple[bool, str]:
    """
    Validates that a password satisfies strict enterprise security requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter."
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter."
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number."
    special_chars = set("!@#$%^&*()-_=+[]{}|;:,.<>?/~`'\"\\")
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character (!@#$%^&* etc)."
    return True, ""

import secrets

def generate_otp_code() -> str:
    """Generates a secure 6-digit numeric OTP code."""
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_otp_code(code: str) -> str:
    """Hashes the 6-digit code using bcrypt."""
    return get_password_hash(code)

def verify_otp_code(code: str, hashed_code: str) -> bool:
    """Verifies a plain OTP code against the stored hash."""
    return verify_password(code, hashed_code)

def create_pending_otp_token(user_id: str) -> str:
    """Creates a short-lived pending JWT token to securely bridge step 1 (login) and step 2 (verify-otp)."""
    return create_access_token(
        data={"sub": str(user_id), "purpose": "otp_pending"},
        expires_delta=timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    )

def mask_email(email: str) -> str:
    """Masks email address for UI presentation e.g. j***e@example.com"""
    if "@" not in email:
        return email
    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = local_part[0] + "***"
    else:
        masked_local = local_part[0] + "***" + local_part[-1]
    return f"{masked_local}@{domain}"



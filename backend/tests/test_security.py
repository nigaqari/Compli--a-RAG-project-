import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    raw = "SecureLegalPass2026!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_roundtrip():
    payload = {"sub": "user-12345", "role": "admin", "email": "admin@compli.ai"}
    token = create_access_token(data=payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded["sub"] == "user-12345"
    assert decoded["role"] == "admin"
    assert decoded["email"] == "admin@compli.ai"
    assert "exp" in decoded

def test_invalid_jwt_token():
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"
    decoded = decode_access_token(invalid_token)
    assert decoded is None

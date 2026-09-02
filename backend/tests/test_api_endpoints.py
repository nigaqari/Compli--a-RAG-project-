import pytest
from app.models.document import Document, DocumentType, ProcessingStatus
from app.models.policy import Policy, PolicyCategory
from app.models.report import Report, ReportType, ReportStatus
from app.models.otp import OTPCode
from app.models.user import User

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_signup_strict_validation_and_login_otp_flow(client, db_session):
    # 1. Weak password rejected
    r_weak = client.post("/api/v1/auth/signup", json={
        "full_name": "Test Reviewer",
        "email": "reviewer2026@compli.ai",
        "password": "weak"
    })
    assert r_weak.status_code == 400

    # 2. Strict password accepted
    r_signup = client.post("/api/v1/auth/signup", json={
        "full_name": "Test Reviewer",
        "email": "reviewer2026@compli.ai",
        "password": "StrictEnterprise2026!"
    })
    assert r_signup.status_code == 200
    assert r_signup.json()["email"] == "reviewer2026@compli.ai"

    # 3. Login triggers OTP and returns pending token
    r_login = client.post("/api/v1/auth/login", json={
        "email": "reviewer2026@compli.ai",
        "password": "StrictEnterprise2026!"
    })
    assert r_login.status_code == 200
    login_data = r_login.json()
    assert login_data["requires_otp"] is True
    pending_token = login_data["pending_token"]
    assert len(pending_token) > 20
    assert "r***6@compli.ai" in login_data["masked_email"]

    # 4. Pending token CANNOT be used against protected routes
    r_protected = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {pending_token}"})
    assert r_protected.status_code == 401

    # 5. Wrong OTP code is rejected
    r_wrong = client.post("/api/v1/auth/verify-otp", json={
        "pending_token": pending_token,
        "otp_code": "000000"
    })
    assert r_wrong.status_code == 400
    assert "Invalid verification code" in r_wrong.json()["detail"]

    # 6. Correct OTP code from DB succeeds
    user = db_session.query(User).filter(User.email == "reviewer2026@compli.ai").first()
    otp_record = db_session.query(OTPCode).filter(OTPCode.user_id == user.id, OTPCode.consumed == False).first()
    assert otp_record is not None
    assert otp_record.consumed is False

def test_list_documents(client, db_session, test_user, auth_headers):
    doc = Document(
        filename="Master_Services_Agreement.pdf",
        original_name="Master Services Agreement",
        file_path="storage/documents/sample.pdf",
        document_type=DocumentType.contract,
        owner_id=test_user.id,
        processing_status=ProcessingStatus.completed
    )
    db_session.add(doc)
    db_session.commit()

    response = client.get("/api/v1/documents/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["original_name"] == "Master Services Agreement"

def test_get_single_document(client, db_session, test_user, auth_headers):
    doc = Document(
        filename="NDA_Acme.pdf",
        original_name="NDA Acme",
        file_path="storage/documents/sample_nda.pdf",
        document_type=DocumentType.nda,
        owner_id=test_user.id,
        processing_status=ProcessingStatus.completed
    )
    db_session.add(doc)
    db_session.commit()

    response = client.get(f"/api/v1/documents/{doc.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == doc.id
    assert response.json()["document_type"] == "nda"

def test_list_policies(client, db_session, test_user, auth_headers):
    pol = Policy(
        name="Data Privacy Policy 2026",
        category=PolicyCategory.data_privacy,
        file_path="storage/policies/dp.pdf",
        owner_id=test_user.id,
        current_version=1
    )
    db_session.add(pol)
    db_session.commit()

    response = client.get("/api/v1/policies/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Data Privacy Policy 2026"

def test_global_search_api(client, db_session, test_user, auth_headers):
    doc = Document(
        filename="Cloud_Subscription_Contract.pdf",
        original_name="Cloud Subscription Contract",
        file_path="storage/documents/sample.pdf",
        document_type=DocumentType.contract,
        owner_id=test_user.id,
        processing_status=ProcessingStatus.completed
    )
    db_session.add(doc)
    db_session.commit()

    response = client.get("/api/v1/search/?q=Cloud", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert len(data["documents"]) >= 1
    assert "Cloud" in data["documents"][0]["title"]

def test_reports_crud(client, db_session, test_user, auth_headers):
    doc = Document(
        filename="Vendor_Agreement.pdf",
        original_name="Vendor Agreement",
        file_path="storage/documents/sample.pdf",
        document_type=DocumentType.contract,
        owner_id=test_user.id,
        processing_status=ProcessingStatus.completed
    )
    db_session.add(doc)
    db_session.commit()

    # Create report request
    res_create = client.post("/api/v1/reports/", json={
        "document_id": doc.id,
        "report_type": "executive_summary"
    }, headers=auth_headers)
    assert res_create.status_code == 200
    report_data = res_create.json()
    report_id = report_data["id"]
    assert report_data["status"] == "pending"

    # List reports
    res_list = client.get("/api/v1/reports/", headers=auth_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # Get status
    res_status = client.get(f"/api/v1/reports/{report_id}/status", headers=auth_headers)
    assert res_status.status_code == 200
    assert res_status.json()["id"] == report_id

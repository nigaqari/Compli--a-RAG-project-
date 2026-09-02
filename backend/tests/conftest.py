import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.base import Base
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole

# In-memory SQLite for fast, isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    # Dynamic dependency override
    from app.api import deps
    from app.api.v1.endpoints import auth, documents, chat, analysis, dashboard, policies, reports, search
    app.dependency_overrides[deps.get_db] = override_get_db
    app.dependency_overrides[auth.get_db] = override_get_db
    app.dependency_overrides[documents.get_db] = override_get_db
    app.dependency_overrides[policies.get_db] = override_get_db
    app.dependency_overrides[reports.get_db] = override_get_db
    app.dependency_overrides[search.get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        full_name="Test User",
        role=UserRole.admin,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"sub": test_user.id, "email": test_user.email, "role": test_user.role.value})
    return {"Authorization": f"Bearer {token}"}

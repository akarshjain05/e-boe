import pytest
import asyncio
from typing import AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.database import get_db
from app.models.base import Base
from app.main import app
from app.core.security import create_access_token
from app.models.user import User
from app.models.company import Company
from uuid import uuid4
import os

# SQLite in-memory for testing
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture
def client(db: AsyncSession):
    async def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

from sqlalchemy import select

@pytest.fixture
async def test_company(db: AsyncSession):
    company = await db.scalar(select(Company).where(Company.registration_number == "TEST1234"))
    if not company:
        company = Company(
            id=uuid4(),
            name="Test Company",
            registration_number="TEST1234",
            email="test@company.com",
            phone="1234567890",
            address_line1="Test Address"
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)
    return company

@pytest.fixture
async def test_user(db: AsyncSession, test_company: Company):
    user = await db.scalar(select(User).where(User.email == "test@example.com"))
    if not user:
        user = User(
            id=uuid4(),
            email="test@example.com",
            first_name="Test",
            last_name="User",
            company_id=test_company.id,
            password_hash="testhash",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

@pytest.fixture
def authorized_client(client: TestClient, test_user: User):
    token = create_access_token(data={"sub": str(test_user.id)})
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {token}"
    }
    return client

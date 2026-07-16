from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.company import Company
from app.models.user import User, UserSession
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, data: RegisterRequest) -> User:
        # Check if user exists
        stmt = select(User).where(User.email == data.email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create company
        company = Company(
            id=uuid4(),
            name=data.company_name,
            email=data.company_email,
            organization_type=data.organization_type,
            pan_number=data.company_pan,
            phone=data.company_phone,
            website=data.company_website,
            gst_number=data.gst_number,
            address_line1=data.address_line1,
            city=data.city,
            state=data.state,
            country=data.country,
            postal_code=data.postal_code,
            currency_code="INR",
            timezone="Asia/Kolkata"
        )
        self.db.add(company)
        await self.db.flush()

        # Create user
        user = User(
            id=uuid4(),
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            pan_number=data.owner_pan,
            phone=data.phone,
            company_id=company.id,
            is_active=True,
            is_superuser=True  # First user of company is superuser
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user

    async def authenticate_user(self, data: LoginRequest, ip_address: str, user_agent: str) -> dict:
        stmt = select(User).join(Company, User.company_id == Company.id).where(Company.gst_number == data.gst_number, User.is_superuser == True).limit(1)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )

        # Update last login
        user.last_login_at = datetime.now(UTC)
        
        # Create tokens
        access_token_expires = 30  # mins
        access_token = create_access_token(
            data={"sub": str(user.id), "company_id": str(user.company_id)}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )

        # Create session
        session = UserSession(
            user_id=user.id,
            refresh_token_hash=hash_password(refresh_token),
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
            last_active_at=datetime.now(UTC),
            expires_at=datetime.now(UTC)
        )
        self.db.add(session)
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": access_token_expires * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "company_id": str(user.company_id)
            }
        }

    async def refresh_token(self, refresh_token: str, ip_address: str, user_agent: str) -> dict:
        from jose import JWTError
        try:
            payload = verify_token(refresh_token)
            user_id = payload.get("sub")
            token_type = payload.get("type")
            if not user_id or token_type != "refresh":
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
            
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

        access_token_expires = 30
        access_token = create_access_token(data={"sub": str(user.id), "company_id": str(user.company_id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": access_token_expires * 60
        }

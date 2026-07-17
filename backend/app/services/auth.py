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

    async def fetch_gst_details(self, gst_number: str) -> dict:
        from app.core.config import settings
        
        result = {
            "company_name": None,
            "legal_name": None,
            "address_line1": None,
            "city": None,
            "state": None,
            "postal_code": None
        }

        if settings.RAPIDAPI_KEY:
            import httpx
            url = f"https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/{gst_number}"
            headers = {
                "x-rapidapi-host": "gst-insights-api.p.rapidapi.com",
                "x-rapidapi-key": settings.RAPIDAPI_KEY
            }
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        gst_resp = response.json()
                        if gst_resp.get("success") and gst_resp.get("data") and len(gst_resp["data"]) > 0:
                            gst_data = gst_resp["data"][0]
                            result["legal_name"] = gst_data.get("legalName")
                            result["company_name"] = gst_data.get("tradeName") or gst_data.get("legalName")
                            
                            address_obj = gst_data.get("principalAddress", {}).get("address", {})
                            if address_obj:
                                street = address_obj.get("street", "")
                                bno = address_obj.get("buildingNumber", "")
                                loc = address_obj.get("location", "")
                                parts = [p for p in [bno, street, loc] if p]
                                result["address_line1"] = ", ".join(parts)[:255] if parts else "Address not provided"
                                result["city"] = address_obj.get("district", address_obj.get("city", ""))
                                result["state"] = address_obj.get("stateCode", "")
                                result["postal_code"] = address_obj.get("pincode", "")
            except Exception as e:
                print(f"RapidAPI GST Lookup failed: {e}")
                
        return result

    async def register_user(self, data: RegisterRequest) -> User:
        # Check if user exists
        stmt = select(User).where(User.email == data.email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Fetch RapidAPI GST details
        gst_details = await self.fetch_gst_details(data.gst_number)
        
        company_name = data.company_name or gst_details["company_name"] or "Unknown Company"
        legal_name = gst_details["legal_name"]
        pan_number = data.company_pan or (data.gst_number[2:12] if len(data.gst_number) >= 12 else None)
        address_line1 = data.address_line1 or gst_details["address_line1"]
        city = data.city or gst_details["city"]
        state = data.state or gst_details["state"]
        postal_code = data.postal_code or gst_details["postal_code"]
        country = data.country or "India"

        # Create company
        company = Company(
            id=uuid4(),
            name=company_name,
            legal_name=legal_name,
            email=data.company_email or data.email,
            organization_type=data.organization_type or "Business",
            pan_number=pan_number,
            phone=data.company_phone or data.phone or "0000000000",
            website=data.company_website,
            gst_number=data.gst_number,
            address_line1=address_line1,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
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
            first_name=data.first_name or "Admin",
            last_name=data.last_name or "",
            pan_number=data.owner_pan or pan_number,
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

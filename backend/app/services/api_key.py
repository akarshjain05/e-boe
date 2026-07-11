from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.settings import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse
from app.core.security import generate_api_key, hash_password, verify_password
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone

class ApiKeyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100):
        stmt = select(ApiKey).where(
            ApiKey.company_id == company_id
        ).order_by(ApiKey.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create(self, company_id: UUID, data: ApiKeyCreate, user_id: UUID) -> ApiKeyResponse:
        raw_key = generate_api_key()
        key_prefix = raw_key[:8]
        hashed_key = hash_password(raw_key)

        expires_at = None
        if data.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_in_days)

        db_key = ApiKey(
            id=uuid4(),
            company_id=company_id,
            name=data.name,
            key_prefix=key_prefix,
            hashed_key=hashed_key,
            expires_at=expires_at,
            created_by=user_id
        )
        
        self.db.add(db_key)
        await self.db.commit()
        await self.db.refresh(db_key)

        # We return a synthetic response model containing the raw key
        # since this is the ONLY time we'll ever be able to show it.
        return ApiKeyResponse(
            id=db_key.id,
            name=db_key.name,
            key_prefix=db_key.key_prefix,
            is_active=db_key.is_active,
            expires_at=db_key.expires_at,
            last_used_at=db_key.last_used_at,
            created_at=db_key.created_at,
            created_by=db_key.created_by,
            raw_key=raw_key
        )

    async def revoke(self, id: UUID, company_id: UUID):
        stmt = select(ApiKey).where(
            ApiKey.id == id,
            ApiKey.company_id == company_id
        )
        result = await self.db.execute(stmt)
        db_key = result.scalar_one_or_none()
        
        if not db_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found")
            
        db_key.is_active = False
        await self.db.commit()
        return {"success": True, "message": "API Key revoked"}

    async def verify_key(self, raw_key: str) -> ApiKey | None:
        if not raw_key or len(raw_key) < 8:
            return None
            
        prefix = raw_key[:8]
        stmt = select(ApiKey).where(
            ApiKey.key_prefix == prefix,
            ApiKey.is_active == True
        )
        result = await self.db.execute(stmt)
        keys = result.scalars().all()
        
        # In case of prefix collision, check all matches
        for db_key in keys:
            if db_key.expires_at and db_key.expires_at < datetime.now(timezone.utc):
                continue
                
            if verify_password(raw_key, db_key.hashed_key):
                # Update last used
                db_key.last_used_at = datetime.now(timezone.utc)
                await self.db.commit()
                return db_key
                
        return None

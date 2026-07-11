from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.schemas.api_key import ApiKeyCreate, ApiKeyOut, ApiKeyResponse
from app.services.api_key import ApiKeyService
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.get("", response_model=List[ApiKeyOut])
async def list_api_keys(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all API keys for the current company."""
    service = ApiKeyService(db)
    return await service.get_all(current_user.company_id, skip, limit)

@router.post("", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new API key. The raw key is ONLY returned in this response."""
    service = ApiKeyService(db)
    return await service.create(current_user.company_id, data, current_user.id)

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke (deactivate) an API key."""
    service = ApiKeyService(db)
    return await service.revoke(key_id, current_user.company_id)

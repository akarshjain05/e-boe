from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.schemas.creditor import CreditorCreate, CreditorUpdate, CreditorResponse
from app.services.creditor import CreditorService
from app.models.user import User
from app.api.dependencies.auth import get_current_user
from app.schemas.common import MessageResponse

router = APIRouter()

@router.get("/", response_model=List[CreditorResponse])
async def get_creditors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creditor_service = CreditorService(db)
    return await creditor_service.get_all(current_user.company_id, skip, limit, search, sort_by, sort_order)

@router.post("/", response_model=CreditorResponse)
async def create_creditor(
    data: CreditorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creditor_service = CreditorService(db)
    return await creditor_service.create(current_user.company_id, data, current_user.id)

@router.get("/{creditor_id}", response_model=CreditorResponse)
async def get_creditor(
    creditor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creditor_service = CreditorService(db)
    return await creditor_service.get_by_id(creditor_id, current_user.company_id)

@router.put("/{creditor_id}", response_model=CreditorResponse)
async def update_creditor(
    creditor_id: UUID,
    data: CreditorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creditor_service = CreditorService(db)
    return await creditor_service.update(creditor_id, current_user.company_id, data, current_user.id)

@router.delete("/{creditor_id}", response_model=MessageResponse)
async def delete_creditor(
    creditor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creditor_service = CreditorService(db)
    return await creditor_service.delete(creditor_id, current_user.company_id, current_user.id)

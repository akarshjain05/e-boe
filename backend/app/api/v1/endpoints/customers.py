from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.customer import CustomerService
from app.models.user import User
from app.api.dependencies.auth import get_current_user
from app.schemas.common import MessageResponse

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    status: Optional[str] = Query(None),
    has_outstanding: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_service = CustomerService(db)
    return await customer_service.get_all(current_user.company_id, skip, limit, search, sort_by, sort_order, status, has_outstanding)

@router.post("/", response_model=CustomerResponse)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_service = CustomerService(db)
    return await customer_service.create(current_user.company_id, data, current_user.id)

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_service = CustomerService(db)
    return await customer_service.get_by_id(customer_id, current_user.company_id)

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_service = CustomerService(db)
    return await customer_service.update(customer_id, current_user.company_id, data, current_user.id)

@router.delete("/{customer_id}", response_model=MessageResponse)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer_service = CustomerService(db)
    return await customer_service.delete(customer_id, current_user.company_id, current_user.id)

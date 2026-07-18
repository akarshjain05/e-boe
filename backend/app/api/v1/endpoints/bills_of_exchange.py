from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.bill_of_exchange import (
    BillOfExchangeCreate,
    BillOfExchangeResponse,
    BillOfExchangeUpdate,
)
from app.services.bill_of_exchange import bill_of_exchange_service

router = APIRouter()


@router.get("/", response_model=List[BillOfExchangeResponse])
async def read_bills_of_exchange(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    customer_id: UUID = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve bills of exchange.
    """
    return await bill_of_exchange_service.get_multi(
        db, company_id=current_user.company_id, skip=skip, limit=limit, customer_id=customer_id
    )


@router.post("/", response_model=BillOfExchangeResponse)
async def create_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    obj_in: BillOfExchangeCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new bill of exchange.
    """
    return await bill_of_exchange_service.create_with_invoices(
        db, obj_in=obj_in, company_id=current_user.company_id, created_by=current_user.id
    )


@router.get("/{id}", response_model=BillOfExchangeResponse)
async def read_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get bill of exchange by ID.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return boe


@router.put("/{id}", response_model=BillOfExchangeResponse)
async def update_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    obj_in: BillOfExchangeUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a bill of exchange.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.update(db, db_obj=boe, obj_in=obj_in)


@router.delete("/{id}", response_model=BillOfExchangeResponse)
async def delete_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a bill of exchange.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.remove(db, id=id)

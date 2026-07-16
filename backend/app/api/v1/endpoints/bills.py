from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.bill import BillCreate, BillResponse, BillUpdate
from app.services.bill import BillService

router = APIRouter()


@router.get("/", response_model=list[BillResponse])
async def get_bills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    bill_type: str = Query("receivable"),
    status: str | None = Query(None),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    creditor_id: UUID | None = Query(None),
    customer_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.get_all(
        current_user.company_id, skip, limit, search, sort_by, sort_order, bill_type, status, from_date, to_date, creditor_id, customer_id
    )

@router.post("/", response_model=BillResponse)
async def create_bill(
    data: BillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.create(current_user.company_id, data, current_user.id)

@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.get_by_id(bill_id, current_user.company_id)

@router.post("/{bill_id}/status/{status}")
async def update_bill_status(
    bill_id: UUID = Path(...),
    status: str = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.update_status(bill_id, current_user.company_id, status, current_user.id)

@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    data: BillUpdate,
    bill_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.update(bill_id, current_user.company_id, data, current_user.id)

@router.delete("/{bill_id}")
async def delete_bill(
    bill_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill_service = BillService(db)
    return await bill_service.delete(bill_id, current_user.company_id, current_user.id)

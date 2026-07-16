from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.payment import (
    BulkPaymentCreate,
    PaymentCreate,
    PaymentResponse,
    RefundCreate,
    RefundResponse,
)
from app.services.payment import PaymentService

router = APIRouter()


@router.get("/", response_model=list[PaymentResponse])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    status: str | None = Query(None),
    payment_method: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.get_all(current_user.company_id, skip, limit, search, sort_by, sort_order, status, payment_method)

@router.post("/", response_model=PaymentResponse)
async def record_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.record_payment(current_user.company_id, data, current_user.id)

@router.post("/bulk", response_model=list[PaymentResponse])
async def record_bulk_payment(
    data: BulkPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.record_bulk_payment(current_user.company_id, data, current_user.id)

@router.post("/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.confirm_payment(payment_id, current_user.company_id, current_user.id)

@router.post("/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment(
    payment_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.reject_payment(payment_id, current_user.company_id, current_user.id)

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.get_by_id(payment_id, current_user.company_id)

@router.get("/bill/{bill_id}", response_model=list[PaymentResponse])
async def get_payments_for_bill(
    bill_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.get_by_bill(bill_id, current_user.company_id)

@router.post("/refund", response_model=RefundResponse)
async def create_refund(
    data: RefundCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_service = PaymentService(db)
    return await payment_service.create_refund(current_user.company_id, data, current_user.id)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.bill import Bill
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.user import User
from app.api.dependencies.auth import get_current_user
from datetime import datetime, timezone, timedelta
from sqlalchemy import or_, and_

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id

    # Base conditions
    receivable_condition = or_(
        and_(Bill.company_id == company_id, Bill.bill_type == "receivable"),
        and_(Bill.network_payee_company_id == company_id, Bill.bill_type == "payable")
    )
    
    payable_condition = or_(
        and_(Bill.company_id == company_id, Bill.bill_type == "payable"),
        and_(Bill.network_drawee_company_id == company_id, Bill.bill_type == "receivable")
    )

    # 1. Total Receivable
    stmt = select(func.sum(Bill.outstanding_amount)).where(
        receivable_condition,
        Bill.is_deleted == False,
        Bill.status.notin_(["draft", "cancelled"])
    )
    result = await db.execute(stmt)
    total_receivable = result.scalar() or 0

    # 2. Total Received
    stmt = select(func.sum(Bill.paid_amount)).where(
        receivable_condition,
        Bill.is_deleted == False
    )
    result = await db.execute(stmt)
    total_received = result.scalar() or 0

    # 3. Total Payable (Excluding draft, cancelled, and pending_acceptance)
    stmt = select(func.sum(Bill.outstanding_amount)).where(
        payable_condition,
        Bill.is_deleted == False,
        Bill.status.notin_(["draft", "cancelled", "pending_acceptance"])
    )
    result = await db.execute(stmt)
    total_payable = result.scalar() or 0

    # 4. Total Paid
    stmt = select(func.sum(Bill.paid_amount)).where(
        payable_condition,
        Bill.is_deleted == False
    )
    result = await db.execute(stmt)
    total_paid = result.scalar() or 0

    # Active bills count
    stmt = select(func.count(Bill.id)).where(
        Bill.company_id == company_id,
        Bill.is_deleted == False,
        Bill.status.notin_(["paid", "cancelled"])
    )
    result = await db.execute(stmt)
    active_bills = result.scalar() or 0

    # Total customers
    stmt = select(func.count(Customer.id)).where(
        Customer.company_id == company_id,
        Customer.is_deleted == False
    )
    result = await db.execute(stmt)
    total_customers = result.scalar() or 0

    # Overdue bills
    stmt = select(func.count(Bill.id)).where(
        or_(receivable_condition, payable_condition),
        Bill.is_deleted == False,
        Bill.status == "overdue"
    )
    result = await db.execute(stmt)
    overdue_count = result.scalar() or 0

    # Bills due this week
    now = datetime.now(timezone.utc).date()
    week_end = now + timedelta(days=7)
    stmt = select(func.count(Bill.id)).where(
        or_(receivable_condition, payable_condition),
        Bill.is_deleted == False,
        Bill.due_date >= now,
        Bill.due_date <= week_end,
        Bill.status.notin_(["paid", "cancelled"])
    )
    result = await db.execute(stmt)
    due_this_week = result.scalar() or 0

    # Recent payments
    stmt = select(Payment).where(
        Payment.company_id == company_id,
        Payment.is_deleted == False
    ).order_by(Payment.created_at.desc()).limit(5)
    result = await db.execute(stmt)
    recent_payments = result.scalars().all()

    return {
        "total_receivable": float(total_receivable),
        "total_received": float(total_received),
        "total_payable": float(total_payable),
        "total_paid": float(total_paid),
        "active_bills": active_bills,
        "total_customers": total_customers,
        "overdue_count": overdue_count,
        "due_this_week": due_this_week,
        "recent_payments": [
            {
                "id": str(p.id),
                "receipt_number": p.receipt_number,
                "amount": float(p.amount),
                "payment_date": str(p.payment_date),
                "status": p.status
            }
            for p in recent_payments
        ]
    }

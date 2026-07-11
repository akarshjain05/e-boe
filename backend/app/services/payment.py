from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.payment import Payment, Refund
from app.models.bill import Bill
from app.schemas.payment import PaymentCreate, RefundCreate, BulkPaymentCreate
from uuid import UUID, uuid4
from datetime import datetime, timezone
import secrets

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_receipt_number(self) -> str:
        return f"RCP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_order: str = "desc", status: str = None, payment_method: str = None):
        stmt = select(Payment).where(
            Payment.company_id == company_id,
            Payment.is_deleted == False
        )
        
        if status:
            stmt = stmt.where(Payment.status == status)
            
        if payment_method:
            stmt = stmt.where(Payment.payment_method == payment_method)
        
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                Payment.receipt_number.ilike(search_term) |
                Payment.transaction_number.ilike(search_term) |
                Payment.reference_number.ilike(search_term)
            )
            
        if sort_by:
            column = getattr(Payment, sort_by, None)
            if column is not None:
                if sort_order.lower() == "desc":
                    stmt = stmt.order_by(column.desc())
                else:
                    stmt = stmt.order_by(column.asc())
        else:
            stmt = stmt.order_by(Payment.created_at.desc())

        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id(self, id: UUID, company_id: UUID) -> Payment:
        stmt = select(Payment).where(
            Payment.id == id,
            Payment.company_id == company_id,
            Payment.is_deleted == False
        )
        result = await self.db.execute(stmt)
        payment = result.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        return payment

    async def get_by_bill(self, bill_id: UUID, company_id: UUID):
        stmt = select(Payment).where(
            Payment.bill_id == bill_id,
            Payment.company_id == company_id,
            Payment.is_deleted == False
        ).order_by(Payment.payment_date.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def record_payment(self, company_id: UUID, data: PaymentCreate, user_id: UUID) -> Payment:
        # Validate bill exists and belongs to the company
        stmt = select(Bill).where(
            Bill.id == data.bill_id,
            Bill.company_id == company_id,
            Bill.is_deleted == False
        )
        result = await self.db.execute(stmt)
        bill = result.scalar_one_or_none()
        if not bill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

        # Enforce that only the drawee (the one who owes) can make a payment
        if bill.bill_type == "receivable":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot record a payment for a receivable bill. Only the drawee can initiate payment."
            )


        # Check if amount exceeds outstanding
        if data.amount > float(bill.outstanding_amount):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ({data.amount}) exceeds outstanding balance ({float(bill.outstanding_amount)})"
            )

        payment = Payment(
            id=uuid4(),
            company_id=company_id,
            bill_id=data.bill_id,
            receipt_number=self._generate_receipt_number(),
            transaction_number=data.transaction_id,
            reference_number=data.reference_number,
            amount=data.amount,
            payment_method=data.payment_method,
            payment_date=data.payment_date,
            bank_name=data.bank_name,
            cheque_number=data.cheque_number,
            cheque_date=data.cheque_date,
            upi_id=data.upi_id,
            transaction_id=data.transaction_id,
            status="confirmed",
            notes=data.notes,
            received_by=user_id,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(payment)

        # Update bill amounts
        bill.paid_amount = float(bill.paid_amount) + data.amount
        bill.outstanding_amount = float(bill.total_amount) - float(bill.paid_amount)

        if bill.outstanding_amount <= 0:
            bill.status = "paid"
            bill.paid_at = datetime.now(timezone.utc)
        else:
            bill.status = "partially_paid"

        bill.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def record_bulk_payment(self, company_id: UUID, data: BulkPaymentCreate, user_id: UUID) -> list[Payment]:
        payments = []
        for payment_data in data.payments:
            single_payment = PaymentCreate(
                bill_id=payment_data.bill_id,
                amount=payment_data.amount,
                payment_method=data.payment_method,
                payment_date=data.payment_date,
                bank_name=data.bank_name,
                cheque_number=data.cheque_number,
                cheque_date=data.cheque_date,
                upi_id=data.upi_id,
                transaction_id=data.transaction_id,
                reference_number=data.reference_number,
                notes=data.notes
            )
            # Use the existing method but we don't commit per payment, but actually the existing method DOES commit.
            # We can just call it in a loop for simplicity, though not transactionally perfect.
            # Or implement bulk logic.
            payments.append(await self.record_payment(company_id, single_payment, user_id))
        return payments

    async def create_refund(self, company_id: UUID, data: RefundCreate, user_id: UUID) -> Refund:
        payment = await self.get_by_id(data.payment_id, company_id)

        if data.amount > float(payment.amount):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund amount exceeds payment amount"
            )

        refund = Refund(
            id=uuid4(),
            payment_id=data.payment_id,
            amount=data.amount,
            reason=data.reason,
            status="pending",
            refund_method=data.refund_method,
            refunded_by=user_id,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(refund)
        await self.db.commit()
        await self.db.refresh(refund)
        return refund

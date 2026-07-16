from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.payment import Payment, Refund
from app.models.bill import Bill
from app.schemas.payment import PaymentCreate, RefundCreate, BulkPaymentCreate
from uuid import UUID, uuid4
from datetime import datetime, timezone
import secrets
from app.tasks.email_tasks import send_bill_notification_email
from app.core.config import settings

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_receipt_number(self) -> str:
        return f"RCP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_order: str = "desc", status: str = None, payment_method: str = None):
        stmt = select(Payment).join(Bill, Payment.bill_id == Bill.id).options(
            selectinload(Payment.bill).selectinload(Bill.creator_company)
        ).where(
            or_(
                Bill.company_id == company_id,
                Bill.network_drawee_company_id == company_id,
                Bill.network_payee_company_id == company_id
            ),
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
        payments = result.scalars().all()
        
        for p in payments:
            if getattr(p, "bill", None):
                p.bill_number = p.bill.bill_number
                
                # Determine bill type relative to current company
                if p.bill.company_id == company_id:
                    p.bill_type = p.bill.bill_type
                elif p.bill.network_drawee_company_id == company_id:
                    p.bill_type = "payable"
                elif p.bill.network_payee_company_id == company_id:
                    p.bill_type = "receivable"
                else:
                    p.bill_type = p.bill.bill_type
                    
                # Determine participant name based on bill type
                if p.bill_type == "receivable":
                    p.participant_name = p.bill.drawee_name
                else:
                    if getattr(p.bill, "creator_company", None):
                        p.participant_name = p.bill.creator_company.name
                    else:
                        p.participant_name = p.bill.drawer_name
                    
        return payments

    async def get_by_id(self, id: UUID, company_id: UUID) -> Payment:
        stmt = select(Payment).join(Bill, Payment.bill_id == Bill.id).where(
            Payment.id == id,
            or_(
                Bill.company_id == company_id,
                Bill.network_drawee_company_id == company_id,
                Bill.network_payee_company_id == company_id
            ),
            Payment.is_deleted == False
        )
        result = await self.db.execute(stmt)
        payment = result.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        return payment

    async def get_by_bill(self, bill_id: UUID, company_id: UUID):
        # We need to verify the user's company is authorized to see this bill
        stmt_bill = select(Bill).where(
            Bill.id == bill_id,
            or_(
                Bill.company_id == company_id,
                Bill.network_drawee_company_id == company_id,
                Bill.network_payee_company_id == company_id
            )
        )
        bill = (await self.db.execute(stmt_bill)).scalar_one_or_none()
        if not bill:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this bill")
            
        stmt = select(Payment).where(
            Payment.bill_id == bill_id,
            Payment.is_deleted == False
        ).order_by(Payment.payment_date.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def record_payment(self, company_id: UUID, data: PaymentCreate, user_id: UUID) -> Payment:
        # Validate bill exists and belongs to the company network
        stmt = select(Bill).where(
            Bill.id == data.bill_id,
            or_(
                Bill.company_id == company_id,
                Bill.network_drawee_company_id == company_id,
                Bill.network_payee_company_id == company_id
            ),
            Bill.is_deleted == False
        )
        result = await self.db.execute(stmt)
        bill = result.scalar_one_or_none()
        if not bill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

        # Determine if caller is Drawee or Drawer
        is_drawee = False
        if bill.bill_type == "payable" and bill.company_id == company_id:
            is_drawee = True
        elif bill.bill_type == "receivable" and bill.network_drawee_company_id == company_id:
            is_drawee = True

        if not is_drawee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only the drawee can initiate a payment."
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
            status="pending_confirmation",
            notes=data.notes,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(payment)

        # Do NOT update bill amounts yet. They will be updated when the Drawer confirms the payment.

        await self.db.commit()
        await self.db.refresh(payment)
        
        # --- Notifications Logic ---
        from app.services.notification import NotificationService
        from app.schemas.notification import NotificationCreate
        from app.models.user import User
        
        notification_service = NotificationService(self.db)
        drawer_company_id = bill.company_id if bill.bill_type == "receivable" else bill.network_payee_company_id
        
        if drawer_company_id:
            users_stmt = select(User).where(User.company_id == drawer_company_id)
            users_res = await self.db.execute(users_stmt)
            for target_user in users_res.scalars().all():
                await notification_service.create(NotificationCreate(
                    company_id=drawer_company_id,
                    user_id=target_user.id,
                    type="payment_recorded",
                    title="Payment Recorded",
                    message=f"A payment of ₹{payment.amount} has been recorded for Bill {bill.bill_number}.",
                    data_json={"bill_id": str(bill.id), "payment_id": str(payment.id)}
                ))
        
        return payment

    async def reject_payment(self, payment_id: UUID, company_id: UUID, user_id: UUID) -> Payment:
        payment = await self.get_by_id(payment_id, company_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        if payment.status != "pending_confirmation":
            raise HTTPException(status_code=400, detail="Only pending payments can be rejected")
            
        # Get the associated bill
        stmt = select(Bill).where(Bill.id == payment.bill_id)
        bill = (await self.db.execute(stmt)).scalar_one_or_none()
        
        # Determine if caller is Drawer
        is_drawer = False
        if bill.bill_type == "receivable" and bill.company_id == company_id:
            is_drawer = True
        elif bill.bill_type == "payable" and bill.network_payee_company_id == company_id:
            is_drawer = True
            
        if not is_drawer:
            raise HTTPException(status_code=403, detail="Only the drawer can reject a payment.")
            
        payment.status = "rejected"
        payment.updated_by = user_id
        
        await self.db.commit()
        await self.db.refresh(payment)
        
        # --- Notifications Logic ---
        from app.services.notification import NotificationService
        from app.schemas.notification import NotificationCreate
        from app.models.user import User
        
        notification_service = NotificationService(self.db)
        drawee_company_id = bill.company_id if bill.bill_type == "payable" else bill.network_drawee_company_id
        
        if drawee_company_id:
            users_stmt = select(User).where(User.company_id == drawee_company_id)
            users_res = await self.db.execute(users_stmt)
            for target_user in users_res.scalars().all():
                await notification_service.create(NotificationCreate(
                    company_id=drawee_company_id,
                    user_id=target_user.id,
                    type="payment_rejected",
                    title="Payment Rejected",
                    message=f"Your payment of ₹{payment.amount} for Bill {bill.bill_number} was rejected.",
                    data_json={"bill_id": str(bill.id), "payment_id": str(payment.id)}
                ))
        
        return payment

    async def confirm_payment(self, payment_id: UUID, company_id: UUID, user_id: UUID) -> Payment:
        payment = await self.get_by_id(payment_id, company_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        if payment.status == "confirmed":
            raise HTTPException(status_code=400, detail="Payment is already confirmed")
            
        # Get the associated bill
        stmt = select(Bill).where(Bill.id == payment.bill_id)
        bill = (await self.db.execute(stmt)).scalar_one_or_none()
        
        # Determine if caller is Drawer
        is_drawer = False
        if bill.bill_type == "receivable" and bill.company_id == company_id:
            is_drawer = True
        elif bill.bill_type == "payable" and bill.network_payee_company_id == company_id:
            is_drawer = True
            
        if not is_drawer:
            raise HTTPException(status_code=403, detail="Only the drawer can confirm a payment.")
            
        payment.status = "confirmed"
        payment.received_by = user_id
        payment.updated_by = user_id
        
        # Update bill amounts
        bill.paid_amount = float(bill.paid_amount) + float(payment.amount)
        bill.outstanding_amount = float(bill.total_amount) - float(bill.paid_amount)

        # Update Customer/Creditor balances
        if bill.bill_type == "receivable" and bill.customer_id:
            from app.models.customer import Customer
            stmt_cust = select(Customer).where(Customer.id == bill.customer_id)
            customer = (await self.db.execute(stmt_cust)).scalar_one_or_none()
            if customer:
                customer.outstanding_balance = float(customer.outstanding_balance) - float(payment.amount)
        elif bill.bill_type == "payable" and bill.creditor_id:
            from app.models.creditor import Creditor
            stmt_cred = select(Creditor).where(Creditor.id == bill.creditor_id)
            creditor = (await self.db.execute(stmt_cred)).scalar_one_or_none()
            if creditor:
                creditor.outstanding_balance = float(creditor.outstanding_balance) - float(payment.amount)

        if bill.outstanding_amount <= 0:
            bill.status = "paid"
            bill.paid_at = datetime.now(timezone.utc)
        else:
            bill.status = "partially_paid"

        bill.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(payment)
        
        # --- Notifications Logic ---
        from app.services.notification import NotificationService
        from app.schemas.notification import NotificationCreate
        from app.models.user import User
        
        notification_service = NotificationService(self.db)
        drawee_company_id = bill.network_drawee_company_id if bill.bill_type == "receivable" else bill.company_id
        
        if drawee_company_id:
            users_stmt = select(User).where(User.company_id == drawee_company_id)
            users_res = await self.db.execute(users_stmt)
            for target_user in users_res.scalars().all():
                await notification_service.create(NotificationCreate(
                    company_id=drawee_company_id,
                    user_id=target_user.id,
                    type="payment_confirmed",
                    title="Payment Confirmed",
                    message=f"Your payment of ₹{payment.amount} for Bill {bill.bill_number} has been confirmed.",
                    data_json={"bill_id": str(bill.id), "payment_id": str(payment.id)}
                ))

        # --- B2C Email Notifications ---
        if bill.bill_type == "receivable" and bill.customer_id:
            from app.models.customer import Customer
            stmt_c = select(Customer).where(Customer.id == bill.customer_id)
            c = (await self.db.execute(stmt_c)).scalar_one_or_none()
            if c and c.customer_type == "B2C" and c.email:
                public_url = f"{settings.FRONTEND_URL}/bill/{bill.public_access_token}"
                send_bill_notification_email.delay(str(bill.id), c.email, "payment_received", public_url)

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

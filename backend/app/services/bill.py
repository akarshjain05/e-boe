from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.bill import Bill, BillItem
from app.models.customer import Customer
from app.models.creditor import Creditor
from app.schemas.bill import BillCreate, BillUpdate
from app.models.company import Company
from uuid import UUID, uuid4
from sqlalchemy import select, func, or_, and_

class BillService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _sync_network_entities(self, company_id: UUID, gst_number: str, target_type: str, user_id: UUID) -> tuple[UUID, UUID] | tuple[None, None]:
        if not gst_number:
            return None, None
            
        # Find the target company by GST number
        stmt = select(Company).where(Company.gst_number == gst_number, Company.is_active == True)
        result = await self.db.execute(stmt)
        target_company = result.scalar_one_or_none()
        
        if not target_company:
            return None, None
            
        # We also need the current company details to create the CRM records
        stmt = select(Company).where(Company.id == company_id)
        result = await self.db.execute(stmt)
        source_company = result.scalar_one_or_none()
        
        if target_type == "drawee":
            # Target company is drawee. We need to create a Creditor in Target Company representing Source Company.
            stmt = select(Creditor).where(Creditor.company_id == target_company.id, Creditor.gst_number == source_company.gst_number)
            result = await self.db.execute(stmt)
            creditor = result.scalar_one_or_none()
            
            if not creditor:
                creditor = Creditor(
                    id=uuid4(),
                    company_id=target_company.id,
                    creditor_code=f"CR-{str(uuid4())[:8].upper()}",
                    name=source_company.name,
                    legal_name=source_company.legal_name,
                    business_type="Corporate",
                    creditor_type="Trade",
                    gst_number=source_company.gst_number,
                    pan_number=source_company.pan_number,
                    email=source_company.email,
                    phone=source_company.phone,
                    status="active",
                    created_by=user_id,
                    updated_by=user_id
                )
                self.db.add(creditor)
                await self.db.flush()
            
            return target_company.id, creditor.id
            
        elif target_type == "payee":
            # Target company is payee. We need to create a Customer in Target Company representing Source Company.
            stmt = select(Customer).where(Customer.company_id == target_company.id, Customer.gst_number == source_company.gst_number)
            result = await self.db.execute(stmt)
            customer = result.scalar_one_or_none()
            
            if not customer:
                customer = Customer(
                    id=uuid4(),
                    company_id=target_company.id,
                    customer_code=f"CU-{str(uuid4())[:8].upper()}",
                    name=source_company.name,
                    legal_name=source_company.legal_name,
                    business_type="Corporate",
                    customer_type="B2B",
                    gst_number=source_company.gst_number,
                    pan_number=source_company.pan_number,
                    email=source_company.email,
                    phone=source_company.phone,
                    status="active",
                    created_by=user_id,
                    updated_by=user_id
                )
                self.db.add(customer)
                await self.db.flush()
                
            return target_company.id, customer.id
            
        return None, None

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_order: str = "desc", bill_type: str = "receivable", status: str = None, from_date: str = None, to_date: str = None, creditor_id: UUID = None, customer_id: UUID = None):
        stmt = select(Bill).options(
            selectinload(Bill.items),
            selectinload(Bill.payments)
        ).where(
            Bill.is_deleted == False
        )
        
        if bill_type == "receivable":
            stmt = stmt.where(
                or_(
                    and_(Bill.company_id == company_id, Bill.bill_type == "receivable"),
                    and_(Bill.network_payee_company_id == company_id, Bill.bill_type == "payable")
                )
            )
            if customer_id:
                stmt = stmt.where(
                    or_(
                        and_(Bill.company_id == company_id, Bill.customer_id == customer_id),
                        and_(Bill.network_payee_company_id == company_id, Bill.payee_customer_id == customer_id)
                    )
                )
        else:
            stmt = stmt.where(
                or_(
                    and_(Bill.company_id == company_id, Bill.bill_type == "payable"),
                    and_(Bill.network_drawee_company_id == company_id, Bill.bill_type == "receivable")
                )
            )
            if creditor_id:
                stmt = stmt.where(
                    or_(
                        and_(Bill.company_id == company_id, Bill.creditor_id == creditor_id),
                        and_(Bill.network_drawee_company_id == company_id, Bill.drawee_creditor_id == creditor_id)
                    )
                )
        
        if status:
            stmt = stmt.where(Bill.status == status)
            
        if from_date:
            stmt = stmt.where(Bill.issue_date >= from_date)
            
        if to_date:
            stmt = stmt.where(Bill.issue_date <= to_date)
        
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                Bill.bill_number.ilike(search_term) |
                Bill.drawee_name.ilike(search_term)
            )
            
        if sort_by:
            column = getattr(Bill, sort_by, None)
            if column is not None:
                if sort_order.lower() == "desc":
                    stmt = stmt.order_by(column.desc())
                else:
                    stmt = stmt.order_by(column.asc())
        else:
            stmt = stmt.order_by(Bill.created_at.desc())

        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id(self, id: UUID, company_id: UUID) -> Bill:
        stmt = select(Bill).options(
            selectinload(Bill.items)
        ).where(
            Bill.id == id,
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
            
        return bill

    async def create(self, company_id: UUID, data: BillCreate, user_id: UUID) -> Bill:
        network_drawee_company_id = None
        drawee_creditor_id = None
        network_payee_company_id = None
        payee_customer_id = None

        # Check if customer or creditor exists based on bill_type
        if data.bill_type == "receivable":
            if not data.customer_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_id is required for receivable bills")
            stmt = select(Customer).where(
                Customer.id == data.customer_id,
                Customer.company_id == company_id,
                Customer.is_deleted == False
            )
            result = await self.db.execute(stmt)
            customer = result.scalar_one_or_none()
            if not customer:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
                
            network_drawee_company_id, drawee_creditor_id = await self._sync_network_entities(
                company_id, customer.gst_number, "drawee", user_id
            )
        else:
            if not data.creditor_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="creditor_id is required for payable bills")
            stmt = select(Creditor).where(
                Creditor.id == data.creditor_id,
                Creditor.company_id == company_id,
                Creditor.is_deleted == False
            )
            result = await self.db.execute(stmt)
            creditor = result.scalar_one_or_none()
            if not creditor:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creditor not found")
                
            network_payee_company_id, payee_customer_id = await self._sync_network_entities(
                company_id, creditor.gst_number, "payee", user_id
            )

        # Check unique bill number
        stmt = select(Bill).where(
            Bill.company_id == company_id,
            Bill.bill_number == data.bill_number,
            Bill.is_deleted == False
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bill number already exists")

        # Determine if transaction is intra-state
        is_intra_state = getattr(data, 'transaction_type', 'intra_state') == 'intra_state'

        # Calculate totals
        total_amount = 0.0
        total_tax = 0.0
        total_discount = 0.0
        
        bill_items = []
        for index, item_data in enumerate(data.items):
            gross = float(item_data.quantity) * item_data.unit_price
            discount = gross * (item_data.discount_percent / 100)
            net = gross - discount
            tax = net * (item_data.tax_rate / 100)
            
            cgst_amount = 0.0
            sgst_amount = 0.0
            igst_amount = 0.0
            
            if is_intra_state:
                cgst_amount = tax / 2
                sgst_amount = tax / 2
            else:
                igst_amount = tax
                
            final_amount = net + tax
            
            total_discount += discount
            total_tax += tax
            total_amount += final_amount
            
            bill_items.append(
                BillItem(
                    id=uuid4(),
                    description=item_data.description,
                    hsn_code=item_data.hsn_code,
                    quantity=item_data.quantity,
                    unit=item_data.unit,
                    unit_price=item_data.unit_price,
                    discount_percent=item_data.discount_percent,
                    tax_rate=item_data.tax_rate,
                    tax_amount=tax,
                    cgst_amount=cgst_amount,
                    sgst_amount=sgst_amount,
                    igst_amount=igst_amount,
                    amount=final_amount,
                    sort_order=index
                )
            )

        bill_data = data.model_dump(exclude={"items"})
        bill = Bill(
            id=uuid4(),
            company_id=company_id,
            **bill_data,
            network_drawee_company_id=network_drawee_company_id,
            drawee_creditor_id=drawee_creditor_id,
            network_payee_company_id=network_payee_company_id,
            payee_customer_id=payee_customer_id,
            amount=total_amount - total_tax,
            discount_amount=total_discount,
            tax_amount=total_tax,
            total_amount=total_amount,
            outstanding_amount=total_amount,
            status="draft",
            items=bill_items,
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(bill)
        await self.db.commit()
        await self.db.refresh(bill)
        
        # Eager load items for response
        return await self.get_by_id(bill.id, company_id)

    async def update_status(self, id: UUID, company_id: UUID, status_val: str, user_id: UUID) -> Bill:
        bill = await self.get_by_id(id, company_id)
        
        valid_statuses = ["draft", "pending_acceptance", "accepted", "rejected", "overdue", "paid", "discounted"]
        if status_val not in valid_statuses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
            
        bill.status = status_val
        bill.updated_by = user_id
        
        await self.db.commit()
        await self.db.refresh(bill)
        
        # --- Notifications Logic ---
        from app.services.notification import NotificationService
        from app.schemas.notification import NotificationCreate
        from app.models.user import User
        
        notification_service = NotificationService(self.db)
        
        target_company_id = None
        message = ""
        title = ""
        n_type = ""
        
        if status_val == "pending_acceptance" and bill.network_drawee_company_id:
            # Drawer is sending to Drawee
            target_company_id = bill.network_drawee_company_id
            title = "New Bill Issued"
            message = f"A new bill ({bill.bill_number}) of ₹{bill.total_amount} has been issued against you by {bill.drawer_name}."
            n_type = "bill_issued"
            
        elif status_val == "accepted" and bill.network_payee_company_id:
            # Drawee accepted, notify Drawer
            target_company_id = bill.network_payee_company_id
            title = "Bill Accepted"
            message = f"Bill {bill.bill_number} has been accepted by {bill.drawee_name}."
            n_type = "bill_accepted"
            
        elif status_val == "rejected" and bill.network_payee_company_id:
            # Drawee rejected, notify Drawer
            target_company_id = bill.network_payee_company_id
            title = "Bill Rejected"
            message = f"Bill {bill.bill_number} has been rejected by {bill.drawee_name}."
            n_type = "bill_rejected"
            
        if target_company_id:
            users_stmt = select(User).where(User.company_id == target_company_id)
            users_res = await self.db.execute(users_stmt)
            for target_user in users_res.scalars().all():
                await notification_service.create(NotificationCreate(
                    company_id=target_company_id,
                    user_id=target_user.id,
                    type=n_type,
                    title=title,
                    message=message,
                    data_json={"bill_id": str(bill.id)}
                ))
        
        return bill

    async def update(self, id: UUID, company_id: UUID, data: BillUpdate, user_id: UUID) -> Bill:
        bill = await self.get_by_id(id, company_id)
            
        # Update bill fields
        update_data = data.model_dump(exclude={"items"}, exclude_unset=True)
        for field, value in update_data.items():
            setattr(bill, field, value)
            
        if data.items is not None:
            # Delete old items
            for item in bill.items:
                await self.db.delete(item)
                
            # Determine if transaction is intra-state
            transaction_type = data.transaction_type if data.transaction_type is not None else getattr(bill, 'transaction_type', 'intra_state')
            is_intra_state = transaction_type == 'intra_state'

            # Create new items
            total_amount = 0.0
            total_tax = 0.0
            total_discount = 0.0
            
            bill_items = []
            for index, item_data in enumerate(data.items):
                gross = float(item_data.quantity) * item_data.unit_price
                discount = gross * (item_data.discount_percent / 100)
                net = gross - discount
                tax = net * (item_data.tax_rate / 100)
                
                cgst_amount = 0.0
                sgst_amount = 0.0
                igst_amount = 0.0
                
                if is_intra_state:
                    cgst_amount = tax / 2
                    sgst_amount = tax / 2
                else:
                    igst_amount = tax

                final_amount = net + tax
                
                total_discount += discount
                total_tax += tax
                total_amount += final_amount
                
                bill_items.append(
                    BillItem(
                        id=uuid4(),
                        bill_id=bill.id,
                        description=item_data.description,
                        hsn_code=item_data.hsn_code,
                        quantity=item_data.quantity,
                        unit=item_data.unit,
                        unit_price=item_data.unit_price,
                        discount_percent=item_data.discount_percent,
                        tax_rate=item_data.tax_rate,
                        tax_amount=tax,
                        cgst_amount=cgst_amount,
                        sgst_amount=sgst_amount,
                        igst_amount=igst_amount,
                        amount=final_amount,
                        sort_order=index
                    )
                )
            
            self.db.add_all(bill_items)
            bill.amount = total_amount - total_tax
            bill.discount_amount = total_discount
            bill.tax_amount = total_tax
            bill.total_amount = total_amount
            bill.outstanding_amount = total_amount

        bill.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(bill)
        
        return await self.get_by_id(bill.id, company_id)

    async def delete(self, id: UUID, company_id: UUID, user_id: UUID):
        bill = await self.get_by_id(id, company_id)
            
        bill.is_deleted = True
        bill.updated_by = user_id
        await self.db.commit()
        return {"message": "Bill deleted successfully"}

from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, or_, and_

from app.models.bill_of_exchange import BillOfExchange, BillOfExchangeInvoice
from app.schemas.bill_of_exchange import BillOfExchangeCreate, BillOfExchangeUpdate


class BillOfExchangeService:
    async def create_with_invoices(
        self, db: AsyncSession, *, obj_in: BillOfExchangeCreate, company_id: UUID, created_by: UUID
    ) -> BillOfExchange:
        # Check for duplicates
        stmt = select(BillOfExchangeInvoice).join(BillOfExchange).where(
            BillOfExchangeInvoice.bill_id.in_(obj_in.invoice_ids),
            BillOfExchange.status.notin_(["cancelled", "rejected"]),
            BillOfExchange.is_deleted == False
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="One or more selected bills are already associated with an active Bill of Exchange")

        # Find network drawee
        from app.models.customer import Customer
        from app.models.company import Company
        network_drawee_company_id = None
        
        stmt = select(Customer).where(Customer.id == obj_in.customer_id)
        customer = (await db.execute(stmt)).scalar_one_or_none()
        
        if customer and customer.gst_number:
            stmt = select(Company).where(Company.gst_number == customer.gst_number, Company.is_active == True)
            target_company = (await db.execute(stmt)).scalar_one_or_none()
            if target_company:
                network_drawee_company_id = target_company.id

        # Create the BOE object
        db_obj = BillOfExchange(
            company_id=company_id,
            customer_id=obj_in.customer_id,
            drawer_name=obj_in.drawer_name,
            drawer_address=obj_in.drawer_address,
            drawer_phone=obj_in.drawer_phone,
            drawer_email=obj_in.drawer_email,
            drawee_name=obj_in.drawee_name,
            drawee_address=obj_in.drawee_address,
            drawee_phone=obj_in.drawee_phone,
            drawee_email=obj_in.drawee_email,
            amount=obj_in.amount,
            description=obj_in.description,
            issue_date=obj_in.issue_date,
            due_date=obj_in.due_date,
            place_of_issue=obj_in.place_of_issue,
            status="issued",
            created_by=created_by,
            network_drawee_company_id=network_drawee_company_id
        )
        db.add(db_obj)
        await db.flush()
        
        # Link invoices
        for invoice_id in obj_in.invoice_ids:
            link = BillOfExchangeInvoice(
                bill_of_exchange_id=db_obj.id,
                bill_id=invoice_id,
                created_by=created_by
            )
            db.add(link)
            
        await db.commit()
        await db.refresh(db_obj)
        
        # Reload with relationships
        return await self.get(db, id=db_obj.id, company_id=company_id)
        
    async def get(self, db: AsyncSession, id: Any, company_id: Optional[UUID] = None) -> Optional[BillOfExchange]:
        query = select(BillOfExchange).options(selectinload(BillOfExchange.invoices)).where(
            BillOfExchange.id == id,
            BillOfExchange.is_deleted == False
        )
        if company_id:
            query = query.where(
                or_(
                    BillOfExchange.company_id == company_id,
                    BillOfExchange.network_drawee_company_id == company_id
                )
            )
            
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
        customer_id: Optional[UUID] = None
    ) -> List[BillOfExchange]:
        query = select(BillOfExchange).options(selectinload(BillOfExchange.invoices)).where(
            or_(
                BillOfExchange.company_id == company_id,
                BillOfExchange.network_drawee_company_id == company_id
            ),
            BillOfExchange.is_deleted == False
        )
        
        if customer_id:
            query = query.where(BillOfExchange.customer_id == customer_id)
            
        query = query.order_by(BillOfExchange.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def update(
        self, db: AsyncSession, *, db_obj: BillOfExchange, obj_in: BillOfExchangeUpdate
    ) -> BillOfExchange:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: UUID) -> BillOfExchange:
        obj = await self.get(db, id=id)
        if not obj:
            raise HTTPException(status_code=404, detail="Bill of exchange not found")
        obj.is_deleted = True
        db.add(obj)
        await db.commit()
        return obj


bill_of_exchange_service = BillOfExchangeService()

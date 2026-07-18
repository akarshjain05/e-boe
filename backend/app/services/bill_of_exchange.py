from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bill_of_exchange import BillOfExchange, BillOfExchangeInvoice
from app.schemas.bill_of_exchange import BillOfExchangeCreate, BillOfExchangeUpdate
from app.services.base import BaseService


class BillOfExchangeService(BaseService[BillOfExchange, BillOfExchangeCreate, BillOfExchangeUpdate]):
    async def create_with_invoices(
        self, db: AsyncSession, *, obj_in: BillOfExchangeCreate, company_id: UUID, created_by: UUID
    ) -> BillOfExchange:
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
            created_by=created_by
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
            query = query.where(BillOfExchange.company_id == company_id)
            
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
            BillOfExchange.company_id == company_id,
            BillOfExchange.is_deleted == False
        )
        
        if customer_id:
            query = query.where(BillOfExchange.customer_id == customer_id)
            
        query = query.order_by(BillOfExchange.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())


bill_of_exchange_service = BillOfExchangeService(BillOfExchange)

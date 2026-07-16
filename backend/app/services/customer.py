from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CustomerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_order: str = "asc", status: str = None, has_outstanding: bool = None, customer_type: str = None):
        stmt = select(Customer).where(
            Customer.company_id == company_id,
            Customer.is_deleted == False
        )
        
        if status:
            stmt = stmt.where(Customer.status == status)
            
        if has_outstanding:
            stmt = stmt.where(Customer.outstanding_balance > 0)
            
        if customer_type:
            stmt = stmt.where(Customer.customer_type == customer_type)
        
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                Customer.name.ilike(search_term) | 
                Customer.email.ilike(search_term) |
                Customer.customer_code.ilike(search_term) |
                Customer.gst_number.ilike(search_term) |
                Customer.phone.ilike(search_term)
            )
            
        if sort_by:
            column = getattr(Customer, sort_by, None)
            if column is not None:
                if sort_order.lower() == "desc":
                    stmt = stmt.order_by(column.desc())
                else:
                    stmt = stmt.order_by(column.asc())
        else:
            stmt = stmt.order_by(Customer.created_at.desc())

        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id(self, id: UUID, company_id: UUID) -> Customer:
        stmt = select(Customer).where(
            Customer.id == id,
            Customer.company_id == company_id,
            Customer.is_deleted == False
        )
        result = await self.db.execute(stmt)
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
            
        return customer

    async def create(self, company_id: UUID, data: CustomerCreate, user_id: UUID) -> Customer:
        # Check if customer code exists
        stmt = select(Customer).where(
            Customer.company_id == company_id, 
            Customer.customer_code == data.customer_code,
            Customer.is_deleted == False
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Customer code {data.customer_code} already exists"
            )

        customer = Customer(
            id=uuid4(),
            company_id=company_id,
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def update(self, id: UUID, company_id: UUID, data: CustomerUpdate, user_id: UUID) -> Customer:
        customer = await self.get_by_id(id, company_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)
            
        customer.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def delete(self, id: UUID, company_id: UUID, user_id: UUID):
        customer = await self.get_by_id(id, company_id)
        
        customer.is_deleted = True
        customer.deleted_at = func.now()
        customer.updated_by = user_id
        
        await self.db.commit()
        return {"success": True, "message": "Customer deleted successfully"}

from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.creditor import Creditor
from app.schemas.creditor import CreditorCreate, CreditorUpdate


class CreditorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, company_id: UUID, skip: int = 0, limit: int = 100, search: str = None, sort_by: str = None, sort_order: str = "asc"):
        stmt = select(Creditor).where(
            Creditor.company_id == company_id,
            Creditor.is_deleted == False
        )
        
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                Creditor.name.ilike(search_term) | 
                Creditor.email.ilike(search_term) |
                Creditor.creditor_code.ilike(search_term)
            )
            
        if sort_by:
            column = getattr(Creditor, sort_by, None)
            if column is not None:
                if sort_order.lower() == "desc":
                    stmt = stmt.order_by(column.desc())
                else:
                    stmt = stmt.order_by(column.asc())
        else:
            stmt = stmt.order_by(Creditor.created_at.desc())

        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id(self, id: UUID, company_id: UUID) -> Creditor:
        stmt = select(Creditor).where(
            Creditor.id == id,
            Creditor.company_id == company_id,
            Creditor.is_deleted == False
        )
        result = await self.db.execute(stmt)
        creditor = result.scalar_one_or_none()
        
        if not creditor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creditor not found")
            
        return creditor

    async def create(self, company_id: UUID, data: CreditorCreate, user_id: UUID) -> Creditor:
        stmt = select(Creditor).where(
            Creditor.company_id == company_id, 
            Creditor.creditor_code == data.creditor_code,
            Creditor.is_deleted == False
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Creditor code {data.creditor_code} already exists"
            )

        creditor = Creditor(
            id=uuid4(),
            company_id=company_id,
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(creditor)
        await self.db.commit()
        await self.db.refresh(creditor)
        return creditor

    async def update(self, id: UUID, company_id: UUID, data: CreditorUpdate, user_id: UUID) -> Creditor:
        creditor = await self.get_by_id(id, company_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(creditor, field, value)
            
        creditor.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(creditor)
        return creditor

    async def delete(self, id: UUID, company_id: UUID, user_id: UUID):
        creditor = await self.get_by_id(id, company_id)
        
        creditor.is_deleted = True
        creditor.deleted_at = func.now()
        creditor.updated_by = user_id
        
        await self.db.commit()
        return {"success": True, "message": "Creditor deleted successfully"}

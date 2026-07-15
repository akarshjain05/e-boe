from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from fastapi import HTTPException

class ProductService:
    async def create(self, db: AsyncSession, *, obj_in: ProductCreate, company_id: UUID) -> Product:
        db_obj = Product(
            **obj_in.model_dump(),
            company_id=company_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> List[Product]:
        query = select(Product).filter(Product.company_id == company_id)
        
        if search:
            search_filter = or_(
                Product.name.ilike(f"%{search}%"),
                Product.hsn_code.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get(self, db: AsyncSession, id: UUID, company_id: UUID) -> Optional[Product]:
        query = select(Product).filter(
            and_(Product.id == id, Product.company_id == company_id)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Product,
        obj_in: ProductUpdate
    ) -> Product:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: UUID, company_id: UUID) -> Product:
        obj = await self.get(db=db, id=id, company_id=company_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Product not found")
            
        await db.delete(obj)
        await db.commit()
        return obj

product_service = ProductService()

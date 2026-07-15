from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.product import product_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def read_products(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve products.
    """
    try:
        from sqlalchemy import text
        await db.execute(text("""
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY,
            company_id UUID REFERENCES companies(id),
            name VARCHAR(255) NOT NULL,
            description VARCHAR(500),
            hsn_code VARCHAR(50),
            unit VARCHAR(50),
            unit_price NUMERIC(15, 2) DEFAULT 0.0,
            tax_rate NUMERIC(5, 2) DEFAULT 0.0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP WITH TIME ZONE,
            created_by UUID,
            updated_by UUID,
            is_deleted BOOLEAN DEFAULT FALSE
        );
        """))
        await db.commit()
    except Exception:
        await db.rollback()

    products = await product_service.get_multi(
        db, company_id=current_user.company_id, skip=skip, limit=limit, search=search
    )
    return products

@router.post("/", response_model=ProductResponse)
async def create_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_in: ProductCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new product.
    """
    product = await product_service.create(
        db, obj_in=product_in, company_id=current_user.company_id
    )
    return product

@router.get("/{id}", response_model=ProductResponse)
async def read_product(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get product by ID.
    """
    product = await product_service.get(db, id=id, company_id=current_user.company_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{id}", response_model=ProductResponse)
async def update_product(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a product.
    """
    product = await product_service.get(db, id=id, company_id=current_user.company_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await product_service.update(db, db_obj=product, obj_in=product_in)
    return product

@router.delete("/{id}", response_model=ProductResponse)
async def delete_product(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a product.
    """
    product = await product_service.delete(db, id=id, company_id=current_user.company_id)
    return product

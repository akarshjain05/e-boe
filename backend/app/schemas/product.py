from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=500)
    hsn_code: str | None = Field(None, max_length=50)
    type: str = Field('goods', max_length=50)
    unit: str | None = Field(None, max_length=50)
    quantity_in_stock: float = Field(0.0, ge=0)
    unit_price: float = Field(0.0, ge=0)
    tax_rate: float = Field(0.0, ge=0, le=100)
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=500)
    hsn_code: str | None = Field(None, max_length=50)
    type: str | None = Field(None, max_length=50)
    unit: str | None = Field(None, max_length=50)
    quantity_in_stock: float | None = Field(None, ge=0)
    unit_price: float | None = Field(None, ge=0)
    tax_rate: float | None = Field(None, ge=0, le=100)
    is_active: bool | None = None

class ProductResponse(ProductBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

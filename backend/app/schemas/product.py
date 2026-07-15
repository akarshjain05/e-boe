from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    hsn_code: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=50)
    unit_price: float = Field(0.0, ge=0)
    tax_rate: float = Field(0.0, ge=0, le=100)
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    hsn_code: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=50)
    unit_price: Optional[float] = Field(None, ge=0)
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

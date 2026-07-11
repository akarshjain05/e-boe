from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CustomerBase(BaseModel):
    customer_type: str = "B2B"
    customer_code: str
    name: str
    legal_name: Optional[str] = None
    business_type: str
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    tan_number: Optional[str] = None
    email: EmailStr
    phone: str
    website: Optional[str] = None
    credit_limit: Optional[float] = None
    payment_terms_days: int = 30
    status: str = "active"
    risk_rating: str = "low"
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    @property
    def is_b2b(self) -> bool:
        return self.customer_type == "B2B"

    def __init__(self, **data):
        super().__init__(**data)
        if self.is_b2b and not self.gst_number:
            raise ValueError("GST number is required for B2B customers")

class CustomerUpdate(CustomerBase):
    customer_code: Optional[str] = None
    name: Optional[str] = None
    business_type: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: UUID
    company_id: UUID
    branch_id: Optional[UUID] = None
    outstanding_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class CreditorBase(BaseModel):
    creditor_type: str = "B2B"
    creditor_code: str
    name: str
    legal_name: str | None = None
    business_type: str
    gst_number: str | None = None
    pan_number: str | None = None
    tan_number: str | None = None
    email: EmailStr
    phone: str
    website: str | None = None
    credit_limit: float | None = None
    payment_terms_days: int = 30
    status: str = "active"
    risk_rating: str = "low"
    notes: str | None = None

class CreditorCreate(CreditorBase):
    @property
    def is_b2b(self) -> bool:
        return self.creditor_type == "B2B"

    def __init__(self, **data):
        super().__init__(**data)
        if self.is_b2b and not self.gst_number:
            raise ValueError("GST number is required for B2B creditors")

class CreditorUpdate(CreditorBase):
    creditor_code: str | None = None
    name: str | None = None
    business_type: str | None = None

class CreditorResponse(CreditorBase):
    id: UUID
    company_id: UUID
    branch_id: UUID | None = None
    outstanding_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

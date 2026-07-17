from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CompanyBase(BaseModel):
    name: str = Field(..., max_length=255)
    legal_name: str | None = Field(None, max_length=255)
    organization_type: str | None = Field(None, max_length=50)
    registration_number: str | None = Field(None, max_length=100)
    tax_id: str | None = Field(None, max_length=100)  # Used for GST
    gst_number: str | None = Field(None, max_length=50)
    pan_number: str | None = Field(None, max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    currency_code: str = Field(default="INR", max_length=3)
    timezone: str = Field(default="Asia/Kolkata", max_length=50)

class CompanyUpdate(CompanyBase):
    pass

class CompanyLookupResponse(CompanyBase):
    source: str = Field(default="internal")
    is_active: bool = Field(default=True)

class CompanyResponse(CompanyBase):
    id: UUID
    logo_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

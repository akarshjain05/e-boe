from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class FinancierProfileBase(BaseModel):
    license_number: str
    license_type: str
    min_rate_bps: int = 0
    max_exposure_limit: Optional[float] = None
    settlement_bank_account_id: Optional[UUID] = None


class FinancierProfileCreate(FinancierProfileBase):
    pass

class FinancierProfileUpdate(BaseModel):
    license_number: Optional[str] = None
    license_type: Optional[str] = None
    min_rate_bps: Optional[int] = None
    max_exposure_limit: Optional[float] = None
    settlement_bank_account_id: Optional[UUID] = None


class FinancierProfileResponse(FinancierProfileBase):
    id: UUID
    company_id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanyBase(BaseModel):
    name: str = Field(..., max_length=255)
    company_type: str = Field(default="tenant", max_length=50)
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
    subscription_plan: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_type: Optional[str] = None
    legal_name: Optional[str] = None
    organization_type: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    currency_code: Optional[str] = None
    timezone: Optional[str] = None


class CompanyLookupResponse(CompanyBase):
    source: str = Field(default="internal")
    is_active: bool = Field(default=True)


class CompanyResponse(CompanyBase):
    id: UUID
    logo_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime | None
    financier_profile: Optional[FinancierProfileResponse] = None

    class Config:
        from_attributes = True

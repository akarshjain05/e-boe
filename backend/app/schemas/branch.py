from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class BranchBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=50)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=50)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    is_active: bool = True
    is_head_office: bool = False

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

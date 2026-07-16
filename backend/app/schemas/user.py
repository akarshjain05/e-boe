from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    phone: str | None = Field(None, max_length=20)
    pan_number: str | None = Field(None, max_length=50)

class UserCreate(UserBase):
    email: EmailStr
    password: str | None = Field(None, min_length=8)

class UserUpdate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    email: EmailStr
    company_id: UUID | None
    branch_id: UUID | None
    role_id: UUID | None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

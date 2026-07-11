from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    pan_number: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    email: EmailStr
    password: Optional[str] = Field(None, min_length=8)

class UserUpdate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    email: EmailStr
    company_id: Optional[UUID]
    branch_id: Optional[UUID]
    role_id: Optional[UUID]
    is_active: bool
    is_verified: bool
    is_superuser: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

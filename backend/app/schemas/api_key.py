from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import datetime

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    expires_in_days: Optional[int] = Field(None, ge=1, le=3650)

class ApiKeyOut(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    is_active: bool
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    created_at: datetime
    created_by: UUID

    class Config:
        from_attributes = True

class ApiKeyResponse(ApiKeyOut):
    raw_key: str = Field(..., description="The unhashed API key. This is only returned once upon creation.")

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    expires_in_days: int | None = Field(None, ge=1, le=3650)

class ApiKeyOut(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    is_active: bool
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime
    created_by: UUID

    class Config:
        from_attributes = True

class ApiKeyResponse(ApiKeyOut):
    raw_key: str = Field(..., description="The unhashed API key. This is only returned once upon creation.")

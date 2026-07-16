from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    priority: str | None = "normal"
    data_json: dict[str, Any] | None = None

class NotificationCreate(NotificationBase):
    company_id: UUID
    user_id: UUID

class NotificationResponse(NotificationBase):
    id: UUID
    company_id: UUID
    user_id: UUID
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

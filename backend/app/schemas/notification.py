from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    priority: Optional[str] = "normal"
    data_json: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    company_id: UUID
    user_id: UUID

class NotificationResponse(NotificationBase):
    id: UUID
    company_id: UUID
    user_id: UUID
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

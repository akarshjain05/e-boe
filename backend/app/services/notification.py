import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: NotificationCreate) -> Notification:
        notification = Notification(
            id=uuid.uuid4(),
            company_id=data.company_id,
            user_id=data.user_id,
            type=data.type,
            title=data.title,
            message=data.message,
            priority=data.priority,
            data_json=data.data_json
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def get_all(self, user_id: uuid.UUID, company_id: uuid.UUID, limit: int = 50) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id, Notification.company_id == company_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        stmt = select(Notification).where(Notification.user_id == user_id, Notification.is_read == False)
        result = await self.db.execute(stmt)
        return len(result.scalars().all())

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        result = await self.db.execute(stmt)
        notification = result.scalar_one_or_none()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(notification)
            
        return notification

    async def mark_all_as_read(self, user_id: uuid.UUID, company_id: uuid.UUID):
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.company_id == company_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.execute(stmt)
        await self.db.commit()


from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification import NotificationService

router = APIRouter()

@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notifications for the current user.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a company")
        
    notification_service = NotificationService(db)
    return await notification_service.get_all(current_user.id, current_user.company_id, limit)

@router.put("/read-all", response_model=dict)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications as read for the current user.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a company")
        
    notification_service = NotificationService(db)
    await notification_service.mark_all_as_read(current_user.id, current_user.company_id)
    return {"status": "success", "message": "All notifications marked as read"}

@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    notification_service = NotificationService(db)
    notification = await notification_service.mark_as_read(notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

import logging

from app.core.celery_app import celery_app

logger = logging.getLogger("eboe")

@celery_app.task
def send_in_app_notification(user_id: str, title: str, message: str, notification_type: str = "info", data: dict = None):
    """Create an in-app notification for a user."""
    # In production, this would create a Notification record in the database
    # and potentially push via WebSocket for real-time delivery
    logger.info(f"Notification for user {user_id}: [{notification_type}] {title}")
    return {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "data": data
    }

@celery_app.task
def send_bulk_notifications(user_ids: list, title: str, message: str, notification_type: str = "info"):
    """Send notifications to multiple users."""
    results = []
    for user_id in user_ids:
        result = send_in_app_notification.delay(user_id, title, message, notification_type)
        results.append({"user_id": user_id, "task_id": str(result.id)})
    return results

@celery_app.task
def send_overdue_reminders():
    """Periodic task: Check for overdue bills and send reminders."""
    logger.info("Running overdue bill reminder check...")
    return {"status": "completed", "bills_processed": 0}

@celery_app.task
def send_boe_public_link_email(email: str, token: str, action: str):
    """
    Sends an email with a public link to a non-tenant drawee.
    action: 'acceptance', 'endorsement', 'discounting-status'
    """
    # In production, this would send an actual email via SendGrid, SES, etc.
    public_url = f"http://localhost:5173/public/bills-of-exchange/{token}"
    subject = f"Action Required: Bill of Exchange {action.capitalize()}"
    body = f"Please click the link to view your Bill of Exchange for {action}:\n{public_url}"
    
    logger.info(f"Simulating email sent to {email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    
    return {"status": "success", "email": email, "action": action}

import logging

from app.core.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger("eboe")

@celery_app.task(bind=True, max_retries=3)
def send_email_task(self, to_email: str, subject: str, body_html: str, body_text: str = ""):
    """Send an email asynchronously via Celery."""
    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = to_email

        if body_text:
            msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_USE_TLS:
                server.starttls()
            if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
                server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return {"status": "sent", "to": to_email}

    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@celery_app.task
def send_bill_notification_email(bill_id: str, recipient_email: str, notification_type: str, public_url: str = None):
    """Send bill-related notification emails (created, accepted, overdue, etc.)."""
    
    action_button = ""
    if public_url:
        action_button = f'<p style="margin-top: 20px;"><a href="{public_url}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Bill</a></p>'
        
    templates = {
        "created": {
            "subject": "New Bill of Exchange Created",
            "body": "<h2>A new Bill of Exchange has been created</h2><p>Bill ID: {bill_id}</p>{action_button}"
        },
        "accepted": {
            "subject": "Bill of Exchange Accepted",
            "body": "<h2>Your Bill of Exchange has been accepted</h2><p>Bill ID: {bill_id}</p>{action_button}"
        },
        "overdue": {
            "subject": "Bill of Exchange Overdue",
            "body": "<h2>Your Bill of Exchange is overdue</h2><p>Bill ID: {bill_id}</p><p>Please make payment at your earliest convenience.</p>{action_button}"
        },
        "payment_received": {
            "subject": "Payment Received",
            "body": "<h2>Payment has been received</h2><p>Bill ID: {bill_id}</p>{action_button}"
        },
    }

    template = templates.get(notification_type, templates["created"])
    body_html = template["body"].format(bill_id=bill_id, action_button=action_button)

    return send_email_task.delay(recipient_email, template["subject"], body_html)

@celery_app.task
def send_boe_notification_email(boe_id: str, recipient_email: str, notification_type: str, public_url: str = None):
    """Send Bill of Exchange related notification emails (issued, accepted, rejected, etc.)."""
    
    action_button = ""
    if public_url:
        action_button = f'<p style="margin-top: 20px;"><a href="{public_url}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Bill of Exchange</a></p>'
        
    templates = {
        "issued": {
            "subject": "Action Required: Accept Bill of Exchange",
            "body": "<h2>A Bill of Exchange requires your acceptance</h2><p>BoE ID: {boe_id}</p><p>Please review and accept or reject the bill of exchange.</p>{action_button}"
        },
        "accepted": {
            "subject": "Bill of Exchange Accepted",
            "body": "<h2>Your Bill of Exchange has been accepted</h2><p>BoE ID: {boe_id}</p>{action_button}"
        },
        "rejected": {
            "subject": "Bill of Exchange Rejected",
            "body": "<h2>Your Bill of Exchange has been rejected</h2><p>BoE ID: {boe_id}</p>{action_button}"
        },
    }

    template = templates.get(notification_type, templates["issued"])
    body_html = template["body"].format(boe_id=boe_id, action_button=action_button)

    return send_email_task.delay(recipient_email, template["subject"], body_html)


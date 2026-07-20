from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "eboe_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.report_tasks",
        "app.tasks.cleanup_tasks",
        "app.tasks.settlement_tasks",
        "app.tasks.discounting_tasks"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
    beat_schedule={
        'daily-overdue-check': {
            'task': 'app.tasks.notification_tasks.send_overdue_reminders',
            'schedule': 86400.0, # Every 24 hours
        },
        'daily-session-cleanup': {
            'task': 'app.tasks.cleanup_tasks.cleanup_expired_sessions',
            'schedule': 86400.0, # Every 24 hours
        },
        'daily-settlement-check': {
            'task': 'app.tasks.settlement_tasks.process_maturity_and_settlement',
            'schedule': 86400.0, # Every 24 hours
        },
        'frequent-bidding-closure-check': {
            'task': 'app.tasks.discounting_tasks.close_expired_biddings',
            'schedule': 900.0, # Every 15 minutes
        }
    }
)

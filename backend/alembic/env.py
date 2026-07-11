import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
import os
import sys

# Add the app directory to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.models.base import Base

# Import all models here to ensure they are registered with Base.metadata
from app.models.user import User, Role, Permission, RolePermission, UserSession
from app.models.company import Company, Branch
from app.models.customer import Customer, CustomerContact, CustomerAddress, CustomerBankDetail, CustomerTag, CustomerNote, CustomerBlacklist
from app.models.bill import Bill, BillItem, BillTerm, BillApproval, BillStatusHistory, BillVersion, BillComment, BillReminder, BillAttachment
from app.models.payment import Payment, PaymentProof, Refund, Adjustment
from app.models.notification import Notification
from app.models.document import Document
from app.models.audit import AuditLog
from app.models.settings import SystemSetting, Currency, TaxConfig, EmailTemplate, ApiKey, Webhook, WebhookLog, Announcement, Bookmark, RecycleBin, CustomField, CustomFieldValue, Holiday, ScheduledReport

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = create_async_engine(settings.DATABASE_URL)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

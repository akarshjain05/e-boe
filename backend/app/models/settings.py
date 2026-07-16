from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text, Numeric, UniqueConstraint, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from datetime import datetime, date
from app.models.base import Base, AuditMixin
from uuid import UUID

class SystemSetting(Base, AuditMixin):
    __tablename__ = "settings"
    company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    key: Mapped[str] = mapped_column(String(100))
    value: Mapped[str] = mapped_column(Text)
    value_type: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    __table_args__ = (UniqueConstraint("company_id", "category", "key", name="uix_company_category_key"),)

class Currency(Base, AuditMixin):
    __tablename__ = "currencies"
    code: Mapped[str] = mapped_column(String(3), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    symbol: Mapped[str] = mapped_column(String(10))
    exchange_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=1.0)
    is_base: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    decimal_places: Mapped[int] = mapped_column(default=2)

class TaxConfig(Base, AuditMixin):
    __tablename__ = "tax_configs"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    rate: Mapped[float] = mapped_column(Numeric(5, 2))
    tax_type: Mapped[str] = mapped_column(String(50))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class EmailTemplate(Base, AuditMixin):
    __tablename__ = "email_templates"
    company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100))
    subject: Mapped[str] = mapped_column(String(255))
    body_html: Mapped[str] = mapped_column(Text)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    variables: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    category: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    __table_args__ = (UniqueConstraint("company_id", "name", name="uix_company_template_name"),)

class ApiKey(Base, AuditMixin):
    __tablename__ = "api_keys"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    key_prefix: Mapped[str] = mapped_column(String(8))
    key_hash: Mapped[str] = mapped_column(String(255))
    permissions: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Webhook(Base, AuditMixin):
    __tablename__ = "webhooks"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    url: Mapped[str] = mapped_column(String(1000))
    secret_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    events: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_count: Mapped[int] = mapped_column(default=0)

class WebhookLog(Base, AuditMixin):
    __tablename__ = "webhook_logs"
    webhook_id: Mapped[UUID] = mapped_column(ForeignKey("webhooks.id"))
    event: Mapped[str] = mapped_column(String(100))
    payload: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    response_status: Mapped[int | None] = mapped_column(nullable=True)
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_success: Mapped[bool] = mapped_column(Boolean)
    delivered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    duration_ms: Mapped[int | None] = mapped_column(nullable=True)

class Announcement(Base, AuditMixin):
    __tablename__ = "announcements"
    company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(50), default="normal")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class Bookmark(Base, AuditMixin):
    __tablename__ = "bookmarks"
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[UUID] = mapped_column()
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    __table_args__ = (UniqueConstraint("user_id", "resource_type", "resource_id", name="uix_user_resource"),)

class RecycleBin(Base, AuditMixin):
    __tablename__ = "recycle_bin"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[UUID] = mapped_column()
    resource_data: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"))
    deleted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class CustomField(Base, AuditMixin):
    __tablename__ = "custom_fields"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    resource_type: Mapped[str] = mapped_column(String(100))
    field_name: Mapped[str] = mapped_column(String(100))
    field_label: Mapped[str] = mapped_column(String(100))
    field_type: Mapped[str] = mapped_column(String(50))
    options: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class CustomFieldValue(Base, AuditMixin):
    __tablename__ = "custom_field_values"
    custom_field_id: Mapped[UUID] = mapped_column(ForeignKey("custom_fields.id"))
    resource_id: Mapped[UUID] = mapped_column()
    value: Mapped[str] = mapped_column(Text)

class Holiday(Base, AuditMixin):
    __tablename__ = "holidays"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    date: Mapped[date] = mapped_column(Date)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    holiday_type: Mapped[str] = mapped_column(String(50))

class ScheduledReport(Base, AuditMixin):
    __tablename__ = "scheduled_reports"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    report_type: Mapped[str] = mapped_column(String(50))
    schedule_cron: Mapped[str] = mapped_column(String(100))
    recipients: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"))
    config: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from datetime import datetime
from app.models.base import Base, AuditMixin
from uuid import UUID

class Notification(Base, AuditMixin):
    __tablename__ = "notifications"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    
    type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    data_json: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="normal")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="notifications")

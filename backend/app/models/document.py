from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Boolean, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base, AuditMixin
from uuid import UUID

class Document(Base, AuditMixin):
    __tablename__ = "documents"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    
    name: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(BigInteger)
    path: Mapped[str] = mapped_column(String(1000))
    
    storage_type: Mapped[str] = mapped_column(String(50), default="local")
    category: Mapped[str] = mapped_column(String(50))
    
    uploaded_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checksum: Mapped[str | None] = mapped_column(String(255), nullable=True)

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AuditMixin, Base


class Product(Base, AuditMixin):
    __tablename__ = "products"
    
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hsn_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    type: Mapped[str | None] = mapped_column(String(50), default="goods")
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity_in_stock: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    company = relationship("Company")

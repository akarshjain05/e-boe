from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import AuditMixin, Base


class Company(Base, AuditMixin):
    __tablename__ = "companies"
    name: Mapped[str] = mapped_column(String(100))
    company_type: Mapped[str] = mapped_column(String(50), default="tenant")
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registration_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    organization_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gst_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    currency_code: Mapped[str] = mapped_column(String(3), default="INR")
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")
    settings_json: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    subscription_plan: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    users = relationship("User", back_populates="company")
    branches = relationship("Branch", back_populates="company")
    customers = relationship("Customer", back_populates="company")
    creditors = relationship("Creditor", back_populates="company")
    financier_profile = relationship("FinancierProfile", back_populates="company", uselist=False)

class FinancierProfile(Base, AuditMixin):
    __tablename__ = "financier_profiles"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), unique=True, index=True)
    license_number: Mapped[str] = mapped_column(String(100))
    license_type: Mapped[str] = mapped_column(String(50)) # bank, nbfc_factor, fi
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    min_rate_bps: Mapped[int] = mapped_column(default=0)
    max_exposure_limit: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    settlement_bank_account_id: Mapped[UUID | None] = mapped_column(nullable=True)
    
    company = relationship("Company", back_populates="financier_profile")

class Branch(Base, AuditMixin):
    __tablename__ = "branches"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    address_line1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_head_office: Mapped[bool] = mapped_column(Boolean, default=False)

    company = relationship("Company", back_populates="branches")
    users = relationship("User", back_populates="branch")
    customers = relationship("Customer", back_populates="branch")
    creditors = relationship("Creditor", back_populates="branch")

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text, Numeric
from datetime import datetime
from app.models.base import Base, AuditMixin
from uuid import UUID

class Customer(Base, AuditMixin):
    __tablename__ = "customers"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    branch_id: Mapped[UUID | None] = mapped_column(ForeignKey("branches.id"), nullable=True)
    
    customer_code: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_type: Mapped[str] = mapped_column(String(50))
    
    customer_type: Mapped[str] = mapped_column(String(50), default="B2B")
    
    gst_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tan_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    credit_limit: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    outstanding_balance: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    payment_terms_days: Mapped[int] = mapped_column(default=30)
    
    status: Mapped[str] = mapped_column(String(50), default="active")
    risk_rating: Mapped[str] = mapped_column(String(50), default="low")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    company = relationship("Company", back_populates="customers")
    branch = relationship("Branch", back_populates="customers")
    contacts = relationship("CustomerContact", back_populates="customer")
    addresses = relationship("CustomerAddress", back_populates="customer")
    bank_details = relationship("CustomerBankDetail", back_populates="customer")
    tags = relationship("CustomerTag", back_populates="customer")
    bills = relationship("Bill", back_populates="customer", foreign_keys="[Bill.customer_id]")

class CustomerContact(Base, AuditMixin):
    __tablename__ = "customer_contacts"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    name: Mapped[str] = mapped_column(String(100))
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="contacts")

class CustomerAddress(Base, AuditMixin):
    __tablename__ = "customer_addresses"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    address_type: Mapped[str] = mapped_column(String(50))
    line1: Mapped[str] = mapped_column(String(255))
    line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100))
    postal_code: Mapped[str] = mapped_column(String(20))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")

class CustomerBankDetail(Base, AuditMixin):
    __tablename__ = "customer_bank_details"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    bank_name: Mapped[str] = mapped_column(String(255))
    branch_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_number: Mapped[str] = mapped_column(String(100))
    account_type: Mapped[str] = mapped_column(String(50))
    ifsc_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    swift_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    iban: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="bank_details")

class CustomerTag(Base, AuditMixin):
    __tablename__ = "customer_tags"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    tag: Mapped[str] = mapped_column(String(50), index=True)
    
    customer = relationship("Customer", back_populates="tags")

class CustomerNote(Base, AuditMixin):
    __tablename__ = "customer_notes"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)

class CustomerBlacklist(Base, AuditMixin):
    __tablename__ = "customer_blacklist"
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"), unique=True)
    reason: Mapped[str] = mapped_column(Text)
    blacklisted_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    blacklisted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

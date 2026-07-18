from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import AuditMixin, Base


class BillOfExchange(Base, AuditMixin):
    __tablename__ = "bills_of_exchange"

    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    customer_id: Mapped[UUID] = mapped_column(ForeignKey("customers.id"))
    network_drawee_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    
    # Drawer (Issuer) Details
    drawer_name: Mapped[str] = mapped_column(String(255))
    drawer_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    drawer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    drawer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Drawee (Customer) Details
    drawee_name: Mapped[str] = mapped_column(String(255))
    drawee_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    drawee_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    drawee_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Bill Details
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    issue_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    place_of_issue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="issued")  # issued, accepted, endorsed, discounted, paid
    
    # Signatures / Files
    boe_pdf_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    company = relationship("Company", foreign_keys="[BillOfExchange.company_id]")
    customer = relationship("Customer", foreign_keys="[BillOfExchange.customer_id]")
    network_drawee_company = relationship("Company", foreign_keys="[BillOfExchange.network_drawee_company_id]")
    invoices = relationship("BillOfExchangeInvoice", back_populates="bill_of_exchange", cascade="all, delete-orphan")


class BillOfExchangeInvoice(Base, AuditMixin):
    __tablename__ = "bills_of_exchange_invoices"
    
    bill_of_exchange_id: Mapped[UUID] = mapped_column(ForeignKey("bills_of_exchange.id"))
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    
    bill_of_exchange = relationship("BillOfExchange", back_populates="invoices")
    bill = relationship("Bill")

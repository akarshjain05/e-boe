from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text, Numeric, Date
from datetime import datetime, date
from app.models.base import Base, AuditMixin
from uuid import UUID

class Payment(Base, AuditMixin):
    __tablename__ = "payments"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True)
    transaction_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    payment_method: Mapped[str] = mapped_column(String(50))
    payment_date: Mapped[date] = mapped_column(Date)
    
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cheque_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cheque_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transaction_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="pending")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    bill = relationship("Bill", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment")

class PaymentProof(Base, AuditMixin):
    __tablename__ = "payment_proofs"
    payment_id: Mapped[UUID] = mapped_column(ForeignKey("payments.id"))
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"))

class Refund(Base, AuditMixin):
    __tablename__ = "refunds"
    payment_id: Mapped[UUID] = mapped_column(ForeignKey("payments.id"))
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    refund_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    refund_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    refunded_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    payment = relationship("Payment", back_populates="refunds")

class Adjustment(Base, AuditMixin):
    __tablename__ = "adjustments"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    adjustment_type: Mapped[str] = mapped_column(String(50))
    reason: Mapped[str] = mapped_column(Text)
    adjusted_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    approved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

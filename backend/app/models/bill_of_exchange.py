from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON
from sqlalchemy.sql import func

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
    
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, issued, rejected, accepted, endorsed, listed_for_discounting, bidding_open, bid_accepted, discounted, matured, paid, settled, defaulted, cancelled
    
    # Signatures / Files
    boe_pdf_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_access_token: Mapped[UUID | None] = mapped_column(index=True, unique=True, nullable=True)
    
    # Ownership and Transfer rules
    current_holder_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    endorsee_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    is_negotiable: Mapped[bool] = mapped_column(Boolean, default=True)
    endorsement_restricted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    company = relationship("Company", foreign_keys="[BillOfExchange.company_id]")
    customer = relationship("Customer", foreign_keys="[BillOfExchange.customer_id]")
    network_drawee_company = relationship("Company", foreign_keys="[BillOfExchange.network_drawee_company_id]")
    current_holder_company = relationship("Company", foreign_keys="[BillOfExchange.current_holder_company_id]")
    endorsee_company = relationship("Company", foreign_keys="[BillOfExchange.endorsee_company_id]")
    invoices = relationship("BillOfExchangeInvoice", back_populates="bill_of_exchange", cascade="all, delete-orphan")
    status_history = relationship("BillOfExchangeStatusHistory", back_populates="bill_of_exchange", cascade="all, delete-orphan")
    endorsements = relationship("BillOfExchangeEndorsement", back_populates="bill_of_exchange", cascade="all, delete-orphan", order_by="BillOfExchangeEndorsement.sequence_no")
    discounting_requests = relationship("DiscountingRequest", back_populates="bill_of_exchange", cascade="all, delete-orphan")


class BillOfExchangeInvoice(Base, AuditMixin):
    __tablename__ = "bills_of_exchange_invoices"
    
    bill_of_exchange_id: Mapped[UUID] = mapped_column(ForeignKey("bills_of_exchange.id"))
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    
    bill_of_exchange = relationship("BillOfExchange", back_populates="invoices")
    bill = relationship("Bill")

class BillOfExchangeStatusHistory(Base, AuditMixin):
    __tablename__ = "boe_status_history"
    bill_of_exchange_id: Mapped[UUID] = mapped_column(ForeignKey("bills_of_exchange.id"))
    from_status: Mapped[str] = mapped_column(String(50))
    to_status: Mapped[str] = mapped_column(String(50))
    changed_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    bill_of_exchange = relationship("BillOfExchange", back_populates="status_history")

class BillOfExchangeEndorsement(Base, AuditMixin):
    __tablename__ = "boe_endorsements"
    bill_of_exchange_id: Mapped[UUID] = mapped_column(ForeignKey("bills_of_exchange.id"))
    sequence_no: Mapped[int] = mapped_column(default=1)
    
    endorser_company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    endorser_name: Mapped[str] = mapped_column(String(255))
    endorser_signature_ref: Mapped[UUID | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    
    endorsee_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    endorsee_name: Mapped[str] = mapped_column(String(255))
    endorsee_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    endorsee_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    endorsee_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    endorsement_type: Mapped[str] = mapped_column(String(50)) # blank, special, restrictive, conditional, sans_recourse
    endorsement_date: Mapped[date] = mapped_column(Date, default=func.current_date())
    endorsed_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    bill_of_exchange = relationship("BillOfExchange", back_populates="endorsements")
    endorser_company = relationship("Company", foreign_keys="[BillOfExchangeEndorsement.endorser_company_id]")
    endorsee_company = relationship("Company", foreign_keys="[BillOfExchangeEndorsement.endorsee_company_id]")
    endorser_signature = relationship("Document", foreign_keys="[BillOfExchangeEndorsement.endorser_signature_ref]")

class DiscountingRequest(Base, AuditMixin):
    __tablename__ = "discounting_requests"
    
    bill_of_exchange_id: Mapped[UUID] = mapped_column(ForeignKey("bills_of_exchange.id"), index=True)
    requested_by_company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    requested_by_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    
    face_value: Mapped[float] = mapped_column(Numeric(15, 2))
    tenor_days: Mapped[int] = mapped_column()
    
    bidding_start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    bidding_end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    min_acceptable_rate_bps: Mapped[int | None] = mapped_column(nullable=True)
    max_acceptable_rate_bps: Mapped[int | None] = mapped_column(nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="open") # open, bid_selected, disbursed, expired, cancelled, withdrawn
    selected_bid_id: Mapped[UUID | None] = mapped_column(ForeignKey("boe_bids.id"), nullable=True)
    
    bill_of_exchange = relationship("BillOfExchange", back_populates="discounting_requests")
    bids = relationship("DiscountingBid", back_populates="discounting_request", cascade="all, delete-orphan", foreign_keys="[DiscountingBid.discounting_request_id]")
    requested_by_company = relationship("Company", foreign_keys="[DiscountingRequest.requested_by_company_id]")
    selected_bid = relationship("DiscountingBid", foreign_keys="[DiscountingRequest.selected_bid_id]")

class DiscountingBid(Base, AuditMixin):
    __tablename__ = "discounting_bids"
    
    discounting_request_id: Mapped[UUID] = mapped_column(ForeignKey("discounting_requests.id"))
    financier_company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    
    discount_rate_bps: Mapped[int] = mapped_column()
    platform_fee_bps: Mapped[int] = mapped_column(default=0)
    computed_discount_amount: Mapped[float] = mapped_column(Numeric(15, 2))
    computed_net_payable: Mapped[float] = mapped_column(Numeric(15, 2))
    
    bid_submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, withdrawn, selected, rejected
    
    discounting_request = relationship("DiscountingRequest", back_populates="bids", foreign_keys="[DiscountingBid.discounting_request_id]")
    financier_company = relationship("Company", foreign_keys="[DiscountingBid.financier_company_id]")

class DiscountingTransaction(Base, AuditMixin):
    __tablename__ = "discounting_transactions"
    
    discounting_request_id: Mapped[UUID] = mapped_column(ForeignKey("discounting_requests.id"))
    bid_id: Mapped[UUID] = mapped_column(ForeignKey("discounting_bids.id"))
    
    financier_company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    seller_company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    
    disbursement_reference: Mapped[str] = mapped_column(String(100))
    disbursed_amount: Mapped[float] = mapped_column(Numeric(15, 2))
    disbursed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    
    maturity_amount_due: Mapped[float] = mapped_column(Numeric(15, 2))
    maturity_settlement_status: Mapped[str] = mapped_column(String(50), default="pending") # pending, settled, defaulted, partially_settled
    
    settled_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    recourse_type: Mapped[str] = mapped_column(String(50), default="without_recourse")
    
    discounting_request = relationship("DiscountingRequest", foreign_keys="[DiscountingTransaction.discounting_request_id]")
    bid = relationship("DiscountingBid", foreign_keys="[DiscountingTransaction.bid_id]")
    financier_company = relationship("Company", foreign_keys="[DiscountingTransaction.financier_company_id]")
    seller_company = relationship("Company", foreign_keys="[DiscountingTransaction.seller_company_id]")

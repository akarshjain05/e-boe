from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text, Numeric, Date
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, date
from app.models.base import Base, AuditMixin
from uuid import UUID

class Bill(Base, AuditMixin):
    __tablename__ = "bills"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"))
    branch_id: Mapped[UUID | None] = mapped_column(ForeignKey("branches.id"), nullable=True)
    bill_number: Mapped[str] = mapped_column(String(50), unique=True)
    
    bill_type: Mapped[str] = mapped_column(String(50), default="receivable")
    
    customer_id: Mapped[UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    creditor_id: Mapped[UUID | None] = mapped_column(ForeignKey("creditors.id"), nullable=True)    
    
    # Network Sync Columns
    network_drawee_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    network_payee_company_id: Mapped[UUID | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    drawee_creditor_id: Mapped[UUID | None] = mapped_column(ForeignKey("creditors.id"), nullable=True)
    payee_customer_id: Mapped[UUID | None] = mapped_column(ForeignKey("customers.id"), nullable=True)

    drawer_name: Mapped[str] = mapped_column(String(255))
    drawer_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    drawer_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    drawer_account: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    drawee_name: Mapped[str] = mapped_column(String(255))
    drawee_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    drawee_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    drawee_account: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    payee_name: Mapped[str] = mapped_column(String(255))
    payee_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    payee_account: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    currency_code: Mapped[str] = mapped_column(String(3), default="INR")
    exchange_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=1.0)
    amount_in_words: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    penalty_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2))
    paid_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(15, 2))
    
    status: Mapped[str] = mapped_column(String(50), default="draft")
    
    issue_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    credit_period_months: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(50), default="intra_state")
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    viewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    place_of_issue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    place_of_payment: Mapped[str | None] = mapped_column(String(255), nullable=True)
    terms_and_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    qr_code_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    barcode_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    digital_signature_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_pattern: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parent_bill_id: Mapped[UUID | None] = mapped_column(ForeignKey("bills.id"), nullable=True)
    version_number: Mapped[int] = mapped_column(default=1)
    approval_chain_id: Mapped[UUID | None] = mapped_column(nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="normal")
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    custom_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    customer = relationship("Customer", back_populates="bills", foreign_keys="[Bill.customer_id]")
    creditor = relationship("Creditor", back_populates="bills", foreign_keys="[Bill.creditor_id]")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    terms = relationship("BillTerm", back_populates="bill", cascade="all, delete-orphan")
    approvals = relationship("BillApproval", back_populates="bill", cascade="all, delete-orphan")
    status_history = relationship("BillStatusHistory", back_populates="bill", cascade="all, delete-orphan")
    versions = relationship("BillVersion", back_populates="bill", cascade="all, delete-orphan")
    comments = relationship("BillComment", back_populates="bill", cascade="all, delete-orphan")
    reminders = relationship("BillReminder", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill")
    creator_company = relationship("Company", foreign_keys="[Bill.company_id]")

class BillItem(Base, AuditMixin):
    __tablename__ = "bill_items"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    description: Mapped[str] = mapped_column(String(500))
    hsn_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(15, 2))
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2))
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    cgst_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    sgst_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    igst_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    sort_order: Mapped[int] = mapped_column(default=0)
    
    bill = relationship("Bill", back_populates="items")

class BillTerm(Base, AuditMixin):
    __tablename__ = "bill_terms"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    term_text: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0)
    
    bill = relationship("Bill", back_populates="terms")

class BillApproval(Base, AuditMixin):
    __tablename__ = "bill_approvals"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    approver_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    level: Mapped[int] = mapped_column(default=1)
    
    bill = relationship("Bill", back_populates="approvals")

class BillStatusHistory(Base, AuditMixin):
    __tablename__ = "bill_status_history"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    from_status: Mapped[str] = mapped_column(String(50))
    to_status: Mapped[str] = mapped_column(String(50))
    changed_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    bill = relationship("Bill", back_populates="status_history")

class BillVersion(Base, AuditMixin):
    __tablename__ = "bill_versions"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    version_number: Mapped[int] = mapped_column()
    data_snapshot: Mapped[dict] = mapped_column(JSONB)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    bill = relationship("Bill", back_populates="versions")

class BillComment(Base, AuditMixin):
    __tablename__ = "bill_comments"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text)
    mentioned_user_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=True)
    parent_comment_id: Mapped[UUID | None] = mapped_column(ForeignKey("bill_comments.id"), nullable=True)
    
    bill = relationship("Bill", back_populates="comments")

class BillReminder(Base, AuditMixin):
    __tablename__ = "bill_reminders"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    reminder_type: Mapped[str] = mapped_column(String(50))
    reminder_date: Mapped[date] = mapped_column(Date)
    message: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    
    bill = relationship("Bill", back_populates="reminders")

class BillAttachment(Base, AuditMixin):
    __tablename__ = "bill_attachments"
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id"))
    document_id: Mapped[UUID] = mapped_column(ForeignKey("documents.id"))

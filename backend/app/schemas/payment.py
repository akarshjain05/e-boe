from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    bill_id: UUID
    amount: float = Field(..., gt=0)
    payment_method: str
    payment_date: date
    bank_name: str | None = None
    cheque_number: str | None = None
    cheque_date: date | None = None
    upi_id: str | None = None
    transaction_id: str | None = None
    reference_number: str | None = None
    notes: str | None = None

class PaymentCreate(PaymentBase):
    pass

class BillPayment(BaseModel):
    bill_id: UUID
    amount: float = Field(..., gt=0)

class BulkPaymentCreate(BaseModel):
    payments: list[BillPayment]
    payment_method: str
    payment_date: date
    bank_name: str | None = None
    cheque_number: str | None = None
    cheque_date: date | None = None
    upi_id: str | None = None
    transaction_id: str | None = None
    reference_number: str | None = None
    notes: str | None = None

class PaymentResponse(PaymentBase):
    id: UUID
    company_id: UUID
    receipt_number: str
    transaction_number: str | None = None
    status: str
    received_by: UUID | None = None
    bill_number: str | None = None
    bill_type: str | None = None
    participant_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RefundCreate(BaseModel):
    payment_id: UUID
    amount: float = Field(..., gt=0)
    reason: str
    refund_method: str | None = None

class RefundResponse(BaseModel):
    id: UUID
    payment_id: UUID
    amount: float
    reason: str
    status: str
    refund_method: str | None = None
    refund_reference: str | None = None
    processed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True

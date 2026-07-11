from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime

class PaymentBase(BaseModel):
    bill_id: UUID
    amount: float = Field(..., gt=0)
    payment_method: str
    payment_date: date
    bank_name: Optional[str] = None
    cheque_number: Optional[str] = None
    cheque_date: Optional[date] = None
    upi_id: Optional[str] = None
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class BillPayment(BaseModel):
    bill_id: UUID
    amount: float = Field(..., gt=0)

class BulkPaymentCreate(BaseModel):
    payments: list[BillPayment]
    payment_method: str
    payment_date: date
    bank_name: Optional[str] = None
    cheque_number: Optional[str] = None
    cheque_date: Optional[date] = None
    upi_id: Optional[str] = None
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: UUID
    company_id: UUID
    receipt_number: str
    transaction_number: Optional[str] = None
    status: str
    received_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RefundCreate(BaseModel):
    payment_id: UUID
    amount: float = Field(..., gt=0)
    reason: str
    refund_method: Optional[str] = None

class RefundResponse(BaseModel):
    id: UUID
    payment_id: UUID
    amount: float
    reason: str
    status: str
    refund_method: Optional[str] = None
    refund_reference: Optional[str] = None
    processed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

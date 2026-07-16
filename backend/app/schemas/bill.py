from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.schemas.creditor import CreditorResponse
from app.schemas.customer import CustomerResponse
from app.schemas.payment import PaymentResponse


class BillItemBase(BaseModel):
    description: str
    hsn_code: str | None = None
    quantity: float
    unit: str | None = None
    unit_price: float
    discount_percent: float = 0.0
    tax_rate: float = 0.0

class BillItemCreate(BillItemBase):
    pass

class BillItemResponse(BillItemBase):
    id: UUID
    amount: float
    tax_amount: float
    cgst_amount: float
    sgst_amount: float
    igst_amount: float
    sort_order: int

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    bill_type: str = "receivable"
    bill_number: str
    drawer_name: str
    drawer_address: str | None = None
    drawer_state: str | None = None
    drawer_account: str | None = None
    
    drawee_name: str
    drawee_address: str | None = None
    drawee_state: str | None = None
    drawee_account: str | None = None
    
    payee_name: str
    payee_address: str | None = None
    payee_account: str | None = None
    
    currency_code: str = "INR"
    exchange_rate: float = 1.0
    
    interest_rate: float = 0.0
    penalty_rate: float = 0.0
    
    issue_date: date
    due_date: date
    credit_period_months: float | None = None
    transaction_type: str = "intra_state"
    
    place_of_issue: str | None = None
    place_of_payment: str | None = None
    terms_and_conditions: str | None = None
    internal_notes: str | None = None
    
    is_recurring: bool = False
    priority: str = "normal"
    tags: dict[str, Any] | None = None

class BillCreate(BillBase):
    customer_id: UUID | None = None
    creditor_id: UUID | None = None
    items: list[BillItemCreate]

class BillUpdate(BaseModel):
    bill_type: str | None = None
    bill_number: str | None = None
    drawer_name: str | None = None
    drawer_address: str | None = None
    drawer_state: str | None = None
    drawer_account: str | None = None
    
    drawee_name: str | None = None
    drawee_address: str | None = None
    drawee_state: str | None = None
    drawee_account: str | None = None
    
    payee_name: str | None = None
    payee_address: str | None = None
    payee_account: str | None = None
    
    currency_code: str | None = None
    exchange_rate: float | None = None
    
    interest_rate: float | None = None
    penalty_rate: float | None = None
    
    issue_date: date | None = None
    due_date: date | None = None
    credit_period_months: float | None = None
    transaction_type: str | None = None
    
    place_of_issue: str | None = None
    place_of_payment: str | None = None
    terms_and_conditions: str | None = None
    internal_notes: str | None = None
    
    is_recurring: bool | None = None
    priority: str | None = None
    tags: dict[str, Any] | None = None
    
    customer_id: UUID | None = None
    creditor_id: UUID | None = None
    items: list[BillItemCreate] | None = None
    status: str | None = None

class BillResponse(BillBase):
    id: UUID
    company_id: UUID
    customer_id: UUID | None = None
    creditor_id: UUID | None = None
    drawee_creditor_id: UUID | None = None
    payee_customer_id: UUID | None = None
    network_drawee_company_id: UUID | None = None
    network_payee_company_id: UUID | None = None
    
    amount: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    outstanding_amount: float
    
    status: str
    
    created_at: datetime
    updated_at: datetime
    
    items: list[BillItemResponse] = []
    payments: list[PaymentResponse] = []
    
    customer: CustomerResponse | None = None
    creditor: CreditorResponse | None = None

    class Config:
        from_attributes = True

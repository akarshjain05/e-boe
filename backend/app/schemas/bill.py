from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime

class BillItemBase(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit: Optional[str] = None
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
    drawer_address: Optional[str] = None
    drawer_state: Optional[str] = None
    drawer_account: Optional[str] = None
    
    drawee_name: str
    drawee_address: Optional[str] = None
    drawee_state: Optional[str] = None
    drawee_account: Optional[str] = None
    
    payee_name: str
    payee_address: Optional[str] = None
    payee_account: Optional[str] = None
    
    currency_code: str = "INR"
    exchange_rate: float = 1.0
    
    interest_rate: float = 0.0
    penalty_rate: float = 0.0
    
    issue_date: date
    due_date: date
    credit_period_months: Optional[float] = None
    transaction_type: str = "intra_state"
    
    place_of_issue: Optional[str] = None
    place_of_payment: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    internal_notes: Optional[str] = None
    
    is_recurring: bool = False
    priority: str = "normal"
    tags: Optional[Dict[str, Any]] = None

class BillCreate(BillBase):
    customer_id: Optional[UUID] = None
    creditor_id: Optional[UUID] = None
    items: List[BillItemCreate]

class BillUpdate(BaseModel):
    bill_type: Optional[str] = None
    bill_number: Optional[str] = None
    drawer_name: Optional[str] = None
    drawer_address: Optional[str] = None
    drawer_state: Optional[str] = None
    drawer_account: Optional[str] = None
    
    drawee_name: Optional[str] = None
    drawee_address: Optional[str] = None
    drawee_state: Optional[str] = None
    drawee_account: Optional[str] = None
    
    payee_name: Optional[str] = None
    payee_address: Optional[str] = None
    payee_account: Optional[str] = None
    
    currency_code: Optional[str] = None
    exchange_rate: Optional[float] = None
    
    interest_rate: Optional[float] = None
    penalty_rate: Optional[float] = None
    
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    credit_period_months: Optional[float] = None
    transaction_type: Optional[str] = None
    
    place_of_issue: Optional[str] = None
    place_of_payment: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    internal_notes: Optional[str] = None
    
    is_recurring: Optional[bool] = None
    priority: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    
    customer_id: Optional[UUID] = None
    creditor_id: Optional[UUID] = None
    items: Optional[List[BillItemCreate]] = None
    status: Optional[str] = None

class BillResponse(BillBase):
    id: UUID
    company_id: UUID
    customer_id: Optional[UUID] = None
    creditor_id: Optional[UUID] = None
    drawee_creditor_id: Optional[UUID] = None
    payee_customer_id: Optional[UUID] = None
    network_drawee_company_id: Optional[UUID] = None
    network_payee_company_id: Optional[UUID] = None
    
    amount: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    outstanding_amount: float
    
    status: str
    
    created_at: datetime
    updated_at: datetime
    
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True

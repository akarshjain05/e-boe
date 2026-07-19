from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BillOfExchangeBase(BaseModel):
    customer_id: UUID
    drawer_name: str
    drawer_address: Optional[str] = None
    drawer_phone: Optional[str] = None
    drawer_email: Optional[str] = None
    drawee_name: str
    drawee_address: Optional[str] = None
    drawee_phone: Optional[str] = None
    drawee_email: Optional[str] = None
    amount: float
    description: Optional[str] = None
    issue_date: date
    due_date: date
    place_of_issue: Optional[str] = None


class BillOfExchangeCreate(BillOfExchangeBase):
    invoice_ids: List[UUID]


class BillOfExchangeUpdate(BaseModel):
    status: Optional[str] = None
    boe_pdf_url: Optional[str] = None
    accepted_at: Optional[datetime] = None
    
    customer_id: Optional[UUID] = None
    drawer_name: Optional[str] = None
    drawer_address: Optional[str] = None
    drawer_phone: Optional[str] = None
    drawer_email: Optional[str] = None
    drawee_name: Optional[str] = None
    drawee_address: Optional[str] = None
    drawee_phone: Optional[str] = None
    drawee_email: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    place_of_issue: Optional[str] = None
    
    invoice_ids: Optional[List[UUID]] = None


class BillOfExchangeInvoiceResponse(BaseModel):
    id: UUID
    bill_of_exchange_id: UUID
    bill_id: UUID

    class Config:
        from_attributes = True


class BillOfExchangeResponse(BillOfExchangeBase):
    id: UUID
    company_id: UUID
    network_drawee_company_id: Optional[UUID] = None
    status: str
    boe_pdf_url: Optional[str] = None
    accepted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    invoices: List[BillOfExchangeInvoiceResponse] = []

    class Config:
        from_attributes = True

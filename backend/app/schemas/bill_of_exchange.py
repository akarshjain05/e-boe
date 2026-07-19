from datetime import date, datetime
from typing import List, Optional, Literal
from uuid import UUID

from pydantic import BaseModel, Field

BOEStatus = Literal[
    "draft", "issued", "rejected", "accepted", "endorsed", 
    "listed_for_discounting", "bidding_open", "bid_accepted", 
    "discounted", "matured", "settled", "defaulted", "paid", "cancelled"
]

EndorsementType = Literal[
    "blank", "special", "restrictive", "conditional", "sans_recourse"
]

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
    is_negotiable: bool = True
    endorsement_restricted: bool = False


class BillOfExchangeCreate(BillOfExchangeBase):
    invoice_ids: List[UUID] = []


class BillOfExchangeUpdate(BaseModel):
    boe_pdf_url: Optional[str] = None
    
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


class BillOfExchangeEndorse(BaseModel):
    endorsee_company_id: Optional[UUID] = None
    endorsee_name: str
    endorsee_address: Optional[str] = None
    endorsee_phone: Optional[str] = None
    endorsee_email: Optional[str] = None
    endorsement_type: EndorsementType
    remarks: Optional[str] = None


class BOEEndorsementBase(BaseModel):
    endorsee_company_id: Optional[UUID] = None
    endorsee_name: str
    endorsee_address: Optional[str] = None
    endorsee_phone: Optional[str] = None
    endorsee_email: Optional[str] = None
    endorsement_type: EndorsementType
    remarks: Optional[str] = None


class BOEEndorsementCreate(BOEEndorsementBase):
    pass


class BOEEndorsementResponse(BOEEndorsementBase):
    id: UUID
    bill_of_exchange_id: UUID
    sequence_no: int
    endorser_company_id: UUID
    endorser_name: str
    endorser_signature_ref: Optional[UUID] = None
    endorsement_date: date
    endorsed_by: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiscountingBidBase(BaseModel):
    financier_company_id: UUID
    discount_rate_bps: int = Field(ge=0)
    platform_fee_bps: int = Field(default=0, ge=0)

class DiscountingBidCreate(DiscountingBidBase):
    pass

class DiscountingBidResponse(DiscountingBidBase):
    id: UUID
    discounting_request_id: UUID
    computed_discount_amount: float
    computed_net_payable: float
    status: str
    bid_submitted_at: datetime
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class DiscountingRequestBase(BaseModel):
    bidding_end_at: datetime
    min_acceptable_rate_bps: Optional[int] = None
    max_acceptable_rate_bps: Optional[int] = None

class DiscountingRequestCreate(DiscountingRequestBase):
    pass

class DiscountingRequestResponse(DiscountingRequestBase):
    id: UUID
    bill_of_exchange_id: UUID
    requested_by_company_id: UUID
    requested_by_user_id: UUID
    face_value: float
    tenor_days: int
    bidding_start_at: datetime
    status: str
    selected_bid_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    bids: list[DiscountingBidResponse] = []

    class Config:
        from_attributes = True


class DiscountingTransactionResponse(BaseModel):
    id: UUID
    discounting_request_id: UUID
    bid_id: UUID
    financier_company_id: UUID
    seller_company_id: UUID
    disbursement_reference: str
    disbursed_amount: float
    disbursed_at: datetime
    maturity_amount_due: float
    maturity_settlement_status: str
    settled_amount: float
    settled_at: Optional[datetime] = None
    recourse_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class BillOfExchangeStatusHistoryResponse(BaseModel):
    id: UUID
    bill_of_exchange_id: UUID
    from_status: str
    to_status: str
    changed_by: UUID | None = None
    changed_at: datetime
    comments: str | None = None

    class Config:
        from_attributes = True


class BillOfExchangeInvoiceResponse(BaseModel):
    id: UUID
    bill_of_exchange_id: UUID
    bill_id: UUID

    class Config:
        from_attributes = True


class BillOfExchangeResponse(BillOfExchangeBase):
    id: UUID
    company_id: UUID
    network_drawee_company_id: UUID | None = None
    current_holder_company_id: UUID | None = None
    status: BOEStatus
    boe_pdf_url: str | None = None
    accepted_at: datetime | None = None
    rejected_at: datetime | None = None
    rejected_reason: str | None = None
    public_access_token: UUID | None = None
    created_at: datetime
    updated_at: datetime
    
    invoices: list[BillOfExchangeInvoiceResponse] = []
    status_history: list[BillOfExchangeStatusHistoryResponse] = []
    endorsements: list[BOEEndorsementResponse] = []
    discounting_requests: list[DiscountingRequestResponse] = []

    class Config:
        from_attributes = True

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.bill_of_exchange import DiscountingRequest, DiscountingBid, DiscountingTransaction, BillOfExchange
from app.schemas.bill_of_exchange import (
    DiscountingBidCreate,
    DiscountingBidResponse,
    DiscountingRequestResponse,
    DiscountingTransactionResponse,
    BillOfExchangeResponse
)
from app.services.bill_of_exchange import bill_of_exchange_service

router = APIRouter()

@router.get("/discounting-requests", response_model=List[DiscountingRequestResponse])
async def get_discounting_requests(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    # Financiers see open requests. Sellers see their own requests.
    company = await db.get(Company, current_user.company_id)
    if not company:
        raise HTTPException(status_code=403, detail="Company not found")
        
    stmt = select(DiscountingRequest).options(selectinload(DiscountingRequest.bids))
    if company.company_type == "financier":
        stmt = stmt.where(DiscountingRequest.status == "open")
    else:
        stmt = stmt.where(DiscountingRequest.requested_by_company_id == current_user.company_id)
        
    stmt = stmt.offset(skip).limit(limit)
    return (await db.execute(stmt)).scalars().all()

@router.get("/discounting-requests/{id}", response_model=DiscountingRequestResponse)
async def get_discounting_request(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingRequest).options(selectinload(DiscountingRequest.bids)).where(DiscountingRequest.id == id)
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=404, detail="Discounting request not found")
        
    company = await db.get(Company, current_user.company_id)
    if company.company_type == "financier":
        # Financiers only see their own bids unless it's closed
        dr.bids = [bid for bid in dr.bids if bid.financier_company_id == current_user.company_id or dr.status != "open"]
    elif dr.requested_by_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
        
    return dr

@router.post("/discounting-requests/{id}/bids", response_model=DiscountingBidResponse)
async def submit_bid(
    id: UUID,
    obj_in: DiscountingBidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingRequest).where(DiscountingRequest.id == id)
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=404, detail="Discounting request not found")
        
    boe = await db.get(BillOfExchange, dr.bill_of_exchange_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")

    company = await db.get(Company, current_user.company_id)
    if not company or company.company_type != "financier" or not company.is_verified:
        raise HTTPException(status_code=403, detail="Only verified financiers can submit bids")

    if obj_in.financier_company_id != current_user.company_id:
        raise HTTPException(status_code=400, detail="Cannot bid on behalf of another company")
        
    return await bill_of_exchange_service.submit_bid(db, db_obj=boe, discounting_request=dr, obj_in=obj_in, user_id=current_user.id)

@router.delete("/discounting-requests/{id}/bids/{bid_id}", response_model=DiscountingBidResponse)
async def withdraw_bid(
    id: UUID,
    bid_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingBid).where(DiscountingBid.id == bid_id, DiscountingBid.discounting_request_id == id)
    bid = (await db.execute(stmt)).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    if bid.financier_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to withdraw this bid")
        
    stmt_dr = select(DiscountingRequest).where(DiscountingRequest.id == id)
    dr = (await db.execute(stmt_dr)).scalar_one_or_none()
    if dr and dr.status != "open":
        raise HTTPException(status_code=400, detail="Cannot withdraw bid as the bidding window is no longer open")
        
    bid.status = "withdrawn"
    await db.commit()
    await db.refresh(bid)
    return bid

from pydantic import BaseModel
class SelectBidRequest(BaseModel):
    bid_id: UUID

@router.post("/discounting-requests/{id}/select-bid", response_model=BillOfExchangeResponse)
async def select_bid(
    id: UUID,
    data: SelectBidRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingRequest).where(DiscountingRequest.id == id)
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=404, detail="Discounting request not found")
        
    if dr.requested_by_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Only the request owner can select a bid")
        
    boe = await db.get(BillOfExchange, dr.bill_of_exchange_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.accept_bid(db, db_obj=boe, discounting_request=dr, bid_id=data.bid_id, user_id=current_user.id)

@router.post("/discounting-requests/{id}/disburse", response_model=BillOfExchangeResponse)
async def disburse(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingRequest).where(DiscountingRequest.id == id, DiscountingRequest.status == "bid_selected")
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=400, detail="No selected bid found for disbursement")
        
    stmt_bid = select(DiscountingBid).where(DiscountingBid.id == dr.selected_bid_id)
    selected_bid = (await db.execute(stmt_bid)).scalar_one_or_none()
    if not selected_bid or selected_bid.financier_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Only the winning financier can disburse funds")
        
    boe = await db.get(BillOfExchange, dr.bill_of_exchange_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.disburse(db, db_obj=boe, discounting_request=dr, user_id=current_user.id)

@router.get("/discounting-transactions", response_model=List[DiscountingTransactionResponse])
async def get_discounting_transactions(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    company = await db.get(Company, current_user.company_id)
    stmt = select(DiscountingTransaction)
    if company.company_type == "financier":
        stmt = stmt.where(DiscountingTransaction.financier_company_id == current_user.company_id)
    else:
        stmt = stmt.where(DiscountingTransaction.seller_company_id == current_user.company_id)
        
    stmt = stmt.offset(skip).limit(limit)
    return (await db.execute(stmt)).scalars().all()

@router.post("/discounting-transactions/{id}/settle", response_model=DiscountingTransactionResponse)
async def manual_settle_transaction(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(DiscountingTransaction).where(DiscountingTransaction.id == id)
    tx = (await db.execute(stmt)).scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Discounting transaction not found")
        
    company = await db.get(Company, current_user.company_id)
    # Allow financier or platform admin
    if tx.financier_company_id != current_user.company_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to settle this transaction")
        
    tx.maturity_settlement_status = "settled"
    
    # Also sync the bill status
    stmt_dr = select(DiscountingRequest).where(DiscountingRequest.id == tx.discounting_request_id)
    dr = (await db.execute(stmt_dr)).scalar_one_or_none()
    if dr:
        boe = await db.get(BillOfExchange, dr.bill_of_exchange_id)
        if boe:
            await bill_of_exchange_service.settle(db, db_obj=boe, user_id=current_user.id)
            
    await db.commit()
    await db.refresh(tx)
    return tx

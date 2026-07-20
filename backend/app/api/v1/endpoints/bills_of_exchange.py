from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.bill_of_exchange import (
    BillOfExchangeCreate,
    BillOfExchangeResponse,
    BillOfExchangeUpdate,
    BillOfExchangeEndorse,
    DiscountingBidCreate,
    DiscountingBidResponse,
    DiscountingRequestCreate,
    DiscountingRequestResponse,
    BOEEndorsementResponse
)
from app.services.bill_of_exchange import bill_of_exchange_service

router = APIRouter()


@router.get("/", response_model=List[BillOfExchangeResponse])
async def read_bills_of_exchange(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    customer_id: UUID = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve bills of exchange.
    """
    return await bill_of_exchange_service.get_multi(
        db, company_id=current_user.company_id, skip=skip, limit=limit, customer_id=customer_id
    )


@router.post("/", response_model=BillOfExchangeResponse)
async def create_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    obj_in: BillOfExchangeCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new bill of exchange.
    """
    return await bill_of_exchange_service.create_with_invoices(
        db, obj_in=obj_in, company_id=current_user.company_id, created_by=current_user.id
    )


@router.get("/{id}", response_model=BillOfExchangeResponse)
async def read_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get bill of exchange by ID.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return boe


@router.put("/{id}", response_model=BillOfExchangeResponse)
async def update_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    obj_in: BillOfExchangeUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a bill of exchange.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.update(db, db_obj=boe, obj_in=obj_in)


@router.delete("/{id}", response_model=BillOfExchangeResponse)
async def delete_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a bill of exchange.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.remove(db, id=id)

@router.post("/{id}/send", response_model=BillOfExchangeResponse)
async def send_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Issue and send a bill of exchange for acceptance.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return await bill_of_exchange_service.issue(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/cancel", response_model=BillOfExchangeResponse)
async def cancel_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Cancel a bill of exchange."""
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.cancel(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/accept", response_model=BillOfExchangeResponse)
async def accept_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Accept a bill of exchange as the drawee.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    if boe.network_drawee_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Only the designated drawee company can accept this bill")
        
    return await bill_of_exchange_service.accept(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/reject", response_model=BillOfExchangeResponse)
async def reject_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Reject a bill of exchange as the drawee.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    if boe.network_drawee_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Only the designated drawee company can reject this bill")
        
    return await bill_of_exchange_service.reject(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/endorse", response_model=BillOfExchangeResponse)
async def endorse_bill_of_exchange(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    obj_in: BillOfExchangeEndorse,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Endorse a bill of exchange to another company.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    if boe.current_holder_company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Only the current holder can endorse this bill")
        
    return await bill_of_exchange_service.endorse(
        db, db_obj=boe,
        endorser_company_id=current_user.company_id,
        user_id=current_user.id,
        obj_in=obj_in
    )

@router.get("/{id}/endorsements", response_model=List[BOEEndorsementResponse])
async def get_bill_endorsements(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get the endorsement chain of a bill of exchange.
    """
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    return boe.endorsements

@router.post("/{id}/discounting-requests", response_model=DiscountingRequestResponse)
async def create_discounting_request(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    obj_in: DiscountingRequestCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.list_for_discounting(db, db_obj=boe, user_id=current_user.id, company_id=current_user.company_id, obj_in=obj_in)

@router.post("/{id}/discounting-requests/{dr_id}/bids", response_model=DiscountingBidResponse)
async def submit_bid(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    dr_id: UUID,
    obj_in: DiscountingBidCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    
    from sqlalchemy import select
    from app.models.bill_of_exchange import DiscountingRequest
    stmt = select(DiscountingRequest).where(DiscountingRequest.id == dr_id, DiscountingRequest.bill_of_exchange_id == id)
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=404, detail="Discounting request not found")

    if obj_in.financier_company_id != current_user.company_id:
        raise HTTPException(status_code=400, detail="Cannot bid on behalf of another company")
    return await bill_of_exchange_service.submit_bid(db, db_obj=boe, discounting_request=dr, obj_in=obj_in, user_id=current_user.id)

@router.post("/{id}/discounting-requests/{dr_id}/bids/{bid_id}/accept", response_model=BillOfExchangeResponse)
async def accept_bid(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    dr_id: UUID,
    bid_id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    from sqlalchemy import select
    from app.models.bill_of_exchange import DiscountingRequest
    stmt = select(DiscountingRequest).where(DiscountingRequest.id == dr_id, DiscountingRequest.bill_of_exchange_id == id)
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=404, detail="Discounting request not found")
        
    return await bill_of_exchange_service.accept_bid(db, db_obj=boe, discounting_request=dr, bid_id=bid_id, user_id=current_user.id)

@router.post("/{id}/disburse", response_model=BillOfExchangeResponse)
async def disburse(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    from sqlalchemy import select
    from app.models.bill_of_exchange import DiscountingRequest
    stmt = select(DiscountingRequest).where(DiscountingRequest.bill_of_exchange_id == id, DiscountingRequest.status == "bid_selected")
    dr = (await db.execute(stmt)).scalar_one_or_none()
    if not dr:
        raise HTTPException(status_code=400, detail="No selected bid found for disbursement")
        
    return await bill_of_exchange_service.disburse(db, db_obj=boe, discounting_request=dr, user_id=current_user.id)

@router.post("/{id}/mature", response_model=BillOfExchangeResponse)
async def mature(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.mature(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/settle", response_model=BillOfExchangeResponse)
async def settle(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.settle(db, db_obj=boe, user_id=current_user.id)

@router.post("/{id}/default", response_model=BillOfExchangeResponse)
async def mark_default(
    *,
    db: AsyncSession = Depends(get_db),
    id: UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    boe = await bill_of_exchange_service.get(db, id=id, company_id=current_user.company_id)
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.mark_default(db, db_obj=boe, user_id=current_user.id)

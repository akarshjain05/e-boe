import logging
import asyncio
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.bill_of_exchange import DiscountingRequest, BillOfExchange, BillOfExchangeBid
from app.models.notification import Notification

logger = logging.getLogger("eboe")

async def async_close_expired_biddings():
    async with SessionLocal() as db:
        now = datetime.utcnow()
        
        stmt = select(DiscountingRequest).options(
            selectinload(DiscountingRequest.bids),
            selectinload(DiscountingRequest.bill)
        ).where(
            DiscountingRequest.status == "open",
            DiscountingRequest.bidding_end_at <= now
        )
        
        expired_requests = (await db.execute(stmt)).scalars().all()
        
        for req in expired_requests:
            # Check for bids
            valid_bids = [b for b in req.bids if b.status == "active"]
            
            if not valid_bids:
                # No bids, expire the request
                req.status = "expired"
                if req.bill:
                    req.bill.status = "endorsed" # Revert status so it can be listed again
                
                notif = Notification(
                    company_id=req.requested_by_company_id,
                    title="Discounting Request Expired",
                    message=f"Bidding for Bill {req.bill_of_exchange_id} ended with no bids.",
                    type="warning",
                    link=f"/bills-of-exchange/{req.bill_of_exchange_id}"
                )
                db.add(notif)
                logger.info(f"DiscountingRequest {req.id} expired with no bids.")
            else:
                # We have bids! 
                # For this implementation, we just flag it as 'review' for manual selection.
                req.status = "review"
                
                notif = Notification(
                    company_id=req.requested_by_company_id,
                    title="Bidding Closed - Review Bids",
                    message=f"Bidding for Bill {req.bill_of_exchange_id} is closed. You have {len(valid_bids)} bid(s) to review.",
                    type="info",
                    link=f"/bills-of-exchange/{req.bill_of_exchange_id}"
                )
                db.add(notif)
                logger.info(f"DiscountingRequest {req.id} closed for review with {len(valid_bids)} bids.")
                
        await db.commit()

@celery_app.task
def close_expired_biddings():
    """Periodic task: Close discounting requests that are past their bidding window."""
    logger.info("Running close_expired_biddings...")
    asyncio.run(async_close_expired_biddings())
    return {"status": "completed"}

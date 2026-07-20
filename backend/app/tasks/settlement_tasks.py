import logging
import asyncio
from datetime import datetime, timedelta

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from sqlalchemy import select
from app.models.bill_of_exchange import BillOfExchange, DiscountingTransaction, DiscountingRequest
from app.models.notification import Notification

logger = logging.getLogger("eboe")

async def async_process_maturity_and_settlement():
    async with SessionLocal() as db:
        today = datetime.utcnow().date()
        grace_period_days = 3
        grace_cutoff = today - timedelta(days=grace_period_days)
        
        # Logic 1: Discounted bills past grace period
        # DiscountingTransaction where maturity_settlement_status == "pending" and boe.due_date <= grace_cutoff
        stmt = select(DiscountingTransaction, BillOfExchange).join(
            DiscountingRequest, DiscountingTransaction.discounting_request_id == DiscountingRequest.id
        ).join(
            BillOfExchange, DiscountingRequest.bill_of_exchange_id == BillOfExchange.id
        ).where(
            DiscountingTransaction.maturity_settlement_status == "pending",
            BillOfExchange.due_date <= grace_cutoff
        )
        
        results = (await db.execute(stmt)).all()
        
        for tx, boe in results:
            tx.maturity_settlement_status = "defaulted"
            boe.status = "defaulted"
            
            notif = Notification(
                company_id=tx.financier_company_id,
                title="Discounting Transaction Defaulted",
                message=f"Bill {boe.id} has passed the grace period without settlement.",
                type="error",
                link=f"/bills-of-exchange/{boe.id}"
            )
            db.add(notif)
            logger.info(f"Marked DiscountingTransaction {tx.id} and Bill {boe.id} as defaulted.")

        # Logic 2: Non-discounted bills (accepted/endorsed) past due date
        stmt2 = select(BillOfExchange).where(
            BillOfExchange.status.in_(["accepted", "endorsed"]),
            BillOfExchange.due_date < today
        )
        
        matured_bills = (await db.execute(stmt2)).scalars().all()
        for boe in matured_bills:
            boe.status = "matured"
            notif = Notification(
                company_id=boe.current_holder_company_id,
                title="Bill Matured",
                message=f"Bill {boe.id} has reached maturity. Please initiate collection.",
                type="info",
                link=f"/bills-of-exchange/{boe.id}"
            )
            db.add(notif)
            logger.info(f"Marked Bill {boe.id} as matured.")
            
        await db.commit()

@celery_app.task
def process_maturity_and_settlement():
    """Daily job to handle settlement and maturity transitions."""
    logger.info("Starting maturity and settlement processing...")
    asyncio.run(async_process_maturity_and_settlement())
    return {"status": "completed"}

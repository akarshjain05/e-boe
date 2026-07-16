from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.bill import Bill
from app.schemas.bill import BillResponse
from app.utils.pdf_generator import BillPDFGenerator

router = APIRouter()

@router.get("/bills/{token}", response_model=BillResponse)
async def get_public_bill(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Bill).options(
        selectinload(Bill.items)
    ).where(Bill.public_access_token == token)
    
    result = await db.execute(stmt)
    bill = result.scalar_one_or_none()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    return bill

@router.post("/bills/{token}/accept", response_model=BillResponse)
async def accept_public_bill(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Bill).options(
        selectinload(Bill.items)
    ).where(Bill.public_access_token == token)
    
    result = await db.execute(stmt)
    bill = result.scalar_one_or_none()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    if bill.status != "pending_acceptance":
        raise HTTPException(status_code=400, detail="Bill cannot be accepted in its current state")
        
    bill.status = "accepted"
    
    # We should update the outstanding balance for the customer!
    if bill.bill_type == "receivable" and bill.customer_id:
        from app.models.customer import Customer
        stmt_cust = select(Customer).where(Customer.id == bill.customer_id)
        customer = (await db.execute(stmt_cust)).scalar_one_or_none()
        if customer:
            customer.outstanding_balance = float(customer.outstanding_balance) + float(bill.outstanding_amount)
            
            # Send Email
            from app.core.config import settings
            from app.tasks.email_tasks import send_bill_notification_email
            if customer.customer_type == "B2C" and customer.email:
                public_url = f"{settings.FRONTEND_URL}/bill/{bill.public_access_token}"
                send_bill_notification_email.delay(str(bill.id), customer.email, "accepted", public_url)
    
    await db.commit()
    await db.refresh(bill)
    
    return bill

@router.get("/bills/{token}/pdf")
async def get_public_bill_pdf(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Bill).options(
        selectinload(Bill.items),
        selectinload(Bill.creator_company)
    ).where(Bill.public_access_token == token)
    
    result = await db.execute(stmt)
    bill = result.scalar_one_or_none()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    pdf_generator = BillPDFGenerator()
    pdf_content = pdf_generator.generate_pdf(bill)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="bill_{bill.bill_number}.pdf"'
        }
    )

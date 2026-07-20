from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.bill import Bill
from app.models.bill_of_exchange import BillOfExchange
from app.schemas.bill import BillResponse
from app.schemas.bill_of_exchange import BillOfExchangeResponse
from app.utils.pdf_generator import BillPDFGenerator
from app.utils.boe_pdf_generator import BOEPDFGenerator
from app.services.bill_of_exchange import bill_of_exchange_service

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
            if customer.email:
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

@router.get("/bills-of-exchange/{token}", response_model=BillOfExchangeResponse)
async def get_public_boe(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(BillOfExchange).options(selectinload(BillOfExchange.invoices)).where(BillOfExchange.public_access_token == token)
    boe = (await db.execute(stmt)).scalar_one_or_none()
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return boe

@router.post("/bills-of-exchange/{token}/accept", response_model=BillOfExchangeResponse)
async def accept_public_boe(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(BillOfExchange).where(BillOfExchange.public_access_token == token)
    boe = (await db.execute(stmt)).scalar_one_or_none()
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.accept(db, db_obj=boe)

@router.post("/bills-of-exchange/{token}/reject", response_model=BillOfExchangeResponse)
async def reject_public_boe(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(BillOfExchange).where(BillOfExchange.public_access_token == token)
    boe = (await db.execute(stmt)).scalar_one_or_none()
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
    return await bill_of_exchange_service.reject(db, db_obj=boe)

@router.get("/bills-of-exchange/{token}/pdf")
async def get_public_boe_pdf(token: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(BillOfExchange).options(selectinload(BillOfExchange.invoices)).where(BillOfExchange.public_access_token == token)
    boe = (await db.execute(stmt)).scalar_one_or_none()
    if not boe:
        raise HTTPException(status_code=404, detail="Bill of exchange not found")
        
    pdf_generator = BOEPDFGenerator()
    boe_data = {
        "drawer_name": boe.drawer_name,
        "drawer_address": boe.drawer_address,
        "drawee_name": boe.drawee_name,
        "drawee_address": boe.drawee_address,
        "amount": boe.amount,
        "issue_date": boe.issue_date,
        "due_date": boe.due_date,
        "place_of_issue": boe.place_of_issue,
        "status": boe.status,
        "accepted_at": boe.accepted_at,
        "description": boe.description
    }
    
    # if it's endorsed, try to get endorsee name
    if boe.endorsee_company_id:
        from app.models.company import Company
        stmt_comp = select(Company).where(Company.id == boe.endorsee_company_id)
        comp = (await db.execute(stmt_comp)).scalar_one_or_none()
        if comp:
            boe_data["endorsee_name"] = comp.name

    pdf_content = pdf_generator.generate(boe_data)
    
    return Response(
        content=pdf_content.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="boe_{boe.id}.pdf"'
        }
    )

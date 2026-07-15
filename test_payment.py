import asyncio
from app.core.database import SessionLocal
from sqlalchemy import select
from app.models.payment import Payment
from app.models.bill import Bill
from app.models.company import Company
async def main():
    async with SessionLocal() as session:
        # Get the latest payment
        stmt = select(Payment, Bill).join(Bill, Payment.bill_id == Bill.id).order_by(Payment.created_at.desc()).limit(1)
        p, b = (await session.execute(stmt)).first()
        
        # Get drawer company
        c_stmt = select(Company).where(Company.id == b.company_id)
        drawer_company = (await session.execute(c_stmt)).scalar()
        
        # Get drawee company
        d_stmt = select(Company).where(Company.id == b.network_drawee_company_id)
        drawee_company = (await session.execute(d_stmt)).scalar()
        
        print(f"Drawer Company Name: {drawer_company.name}")
        print(f"Drawee Company Name: {drawee_company.name if drawee_company else 'None'}")
        print(f"Bill drawer_name field: {b.drawer_name}")
        print(f"Bill drawee_name field: {b.drawee_name}")

if __name__ == "__main__":
    asyncio.run(main())

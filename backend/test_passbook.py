import asyncio

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.bill import Bill
from app.models.payment import Payment


async def main():
    async with SessionLocal() as session:
        # Just grab the last 5 payments
        stmt = select(Payment, Bill).join(Bill, Payment.bill_id == Bill.id).order_by(Payment.created_at.desc()).limit(5)
        result = await session.execute(stmt)
        for p, b in result:
            print(f"Receipt: {p.receipt_number}, Payment Amount: {p.amount}")
            print(f"Bill Company: {b.company_id}, Bill Type: {b.bill_type}")
            print(f"Drawer: {b.drawer_name}, Drawee: {b.drawee_name}")
            print(f"Network Drawee: {b.network_drawee_company_id}, Network Payee: {b.network_payee_company_id}")
            print("---")
            
if __name__ == "__main__":
    asyncio.run(main())

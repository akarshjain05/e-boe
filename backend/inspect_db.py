import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.bill import Bill
from app.models.company import Company

async def inspect():
    async with SessionLocal() as db:
        stmt = select(func.sum(Bill.outstanding_amount)).where(Bill.status.in_(["accepted", "partially_paid", "overdue"]), Bill.is_deleted == False)
        total_outstanding = (await db.execute(stmt)).scalar()
        print(f"Total Bill Outstanding: {total_outstanding}")
        
        stmt = select(Bill).where(Bill.status.in_(["accepted", "partially_paid", "overdue"]), Bill.is_deleted == False)
        bills = (await db.execute(stmt)).scalars().all()
        print(f"Total accepted bills: {len(bills)}")
        for b in bills:
            print(f"Bill {b.id}, company_id: {b.company_id}, customer_id: {b.customer_id}, amount: {b.outstanding_amount}")
            if b.customer_id:
                cust = (await db.execute(select(Customer).where(Customer.id == b.customer_id))).scalar()
                print(f"  Customer: {cust.name}, {cust.email}, {cust.company_id}")

if __name__ == "__main__":
    asyncio.run(inspect())

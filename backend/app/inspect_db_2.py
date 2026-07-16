import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.bill import Bill
from app.models.company import Company
from app.models.user import User

async def inspect():
    async with SessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        for u in users:
            print(f"User: {u.email}, {u.first_name} {u.last_name}, Company: {u.company_id}")
            
        bills = (await db.execute(select(Bill))).scalars().all()
        for b in bills:
            print(f"Bill: {b.bill_number}, amount: {b.outstanding_amount}, status: {b.status}, company: {b.company_id}, customer: {b.customer_id}")

if __name__ == "__main__":
    asyncio.run(inspect())

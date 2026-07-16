import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import SessionLocal
from app.models.bill import Bill

async def inspect():
    async with SessionLocal() as db:
        bill = (await db.execute(select(Bill).where(Bill.bill_number == 'BOE-1784137817'))).scalar_one_or_none()
        if bill:
            print(f"Bill found: {bill.id}, amount: {bill.outstanding_amount}, status: {bill.status}, deleted: {bill.is_deleted}")
        else:
            print("Bill not found")

if __name__ == "__main__":
    asyncio.run(inspect())

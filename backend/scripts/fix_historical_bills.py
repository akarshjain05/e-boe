import asyncio
import os
import sys

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.bill import Bill
from app.models.company import Company


async def main():
    print("Starting historical bills fix...")
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Fetch all bills
        stmt = select(Bill)
        result = await session.execute(stmt)
        bills = result.scalars().all()
        
        updated_count = 0
        for bill in bills:
            changed = False
            # Fix payee name based on network_payee_company_id or company_id
            if bill.network_payee_company_id:
                stmt_company = select(Company).where(Company.id == bill.network_payee_company_id)
                comp_res = await session.execute(stmt_company)
                comp = comp_res.scalar_one_or_none()
                if comp and bill.payee_name != comp.name:
                    bill.payee_name = comp.name
                    changed = True
            elif bill.company_id and bill.bill_type == "receivable":
                stmt_company = select(Company).where(Company.id == bill.company_id)
                comp_res = await session.execute(stmt_company)
                comp = comp_res.scalar_one_or_none()
                if comp and bill.payee_name != comp.name:
                    bill.payee_name = comp.name
                    changed = True

            # Fix drawer name based on network_drawee_company_id or company_id
            if bill.network_drawee_company_id:
                stmt_company = select(Company).where(Company.id == bill.network_drawee_company_id)
                comp_res = await session.execute(stmt_company)
                comp = comp_res.scalar_one_or_none()
                if comp and bill.drawer_name != comp.name:
                    bill.drawer_name = comp.name
                    changed = True
            elif bill.company_id and bill.bill_type == "payable":
                stmt_company = select(Company).where(Company.id == bill.company_id)
                comp_res = await session.execute(stmt_company)
                comp = comp_res.scalar_one_or_none()
                if comp and bill.drawer_name != comp.name:
                    bill.drawer_name = comp.name
                    changed = True
                    
            if changed:
                updated_count += 1
                session.add(bill)
                
        await session.commit()
        print(f"Fixed {updated_count} bills successfully.")

if __name__ == "__main__":
    asyncio.run(main())

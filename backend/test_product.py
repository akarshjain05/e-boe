import asyncio
from app.core.database import SessionLocal
from sqlalchemy import select
from app.models.user import User
from app.models.product import Product

async def main():
    async with SessionLocal() as session:
        user = (await session.execute(select(User).limit(1))).scalar_one_or_none()
        if not user:
            print("No user found")
            return
            
        print(f"Testing with company_id: {user.company_id}")
        
        from app.services.product import product_service
        from app.schemas.product import ProductCreate
        
        try:
            prod_in = ProductCreate(
                name="Test Product",
                unit_price=100.0,
                tax_rate=18.0
            )
            prod = await product_service.create(session, obj_in=prod_in, company_id=user.company_id)
            print(f"Product created: {prod.id}")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

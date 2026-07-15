import asyncio
from app.core.database import SessionLocal
from sqlalchemy import select
from app.models.user import User

async def main():
    async with SessionLocal() as session:
        user = (await session.execute(select(User).limit(1))).scalar_one_or_none()
        if not user:
            print("No user found")
            return
            
        from app.services.product import product_service
        try:
            products = await product_service.get_multi(session, company_id=user.company_id)
            print(f"Products: {products}")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

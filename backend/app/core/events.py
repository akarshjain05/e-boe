from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import engine
from app.core.redis import redis_client
import os
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
    
    # Run data migrations / fixes automatically
    try:
        from scripts.fix_historical_bills import main as fix_bills
        await fix_bills()
        print("Historical bills fix completed successfully.")
    except Exception as e:
        print(f"Failed to run historical bills fix: {e}")
        
    yield
    # Shutdown
    await engine.dispose()
    await redis_client.close()

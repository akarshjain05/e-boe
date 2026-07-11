from redis import asyncio as aioredis
from app.core.config import settings
import json
from typing import Any, Optional

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf8",
    decode_responses=True
)

async def get_redis() -> aioredis.Redis:
    return redis_client

async def set_cached(key: str, value: Any, expire: int = 300) -> None:
    await redis_client.set(key, json.dumps(value), ex=expire)

async def get_cached(key: str) -> Optional[Any]:
    val = await redis_client.get(key)
    if val:
        return json.loads(val)
    return None

async def delete_cached(key: str) -> None:
    await redis_client.delete(key)

async def clear_pattern(pattern: str) -> None:
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)

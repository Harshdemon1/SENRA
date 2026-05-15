import os
import json
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    return _redis


async def cache_get(key: str) -> dict | list | None:
    r = await get_redis()
    val = await r.get(key)
    if val is None:
        return None
    return json.loads(val)


async def cache_set(key: str, value: dict | list, ttl: int = 3600) -> None:
    r = await get_redis()
    await r.setex(key, ttl, json.dumps(value))


async def flush_pattern(pattern: str) -> None:
    r = await get_redis()
    keys = await r.keys(pattern)
    if keys:
        await r.delete(*keys)

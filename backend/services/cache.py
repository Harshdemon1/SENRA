import os
import json
import time
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

# In-memory fallback when REDIS_URL is not set — works fine for local dev
_mem: dict[str, tuple[str, float]] = {}  # key → (json_value, expires_at)
_redis: aioredis.Redis | None = None


def _use_redis() -> bool:
    return bool(os.environ.get("REDIS_URL", "").strip())


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    return _redis


async def cache_get(key: str) -> dict | list | None:
    if not _use_redis():
        entry = _mem.get(key)
        if entry and time.time() < entry[1]:
            return json.loads(entry[0])
        return None
    r = await _get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None


async def cache_set(key: str, value: dict | list, ttl: int = 3600) -> None:
    if not _use_redis():
        _mem[key] = (json.dumps(value), time.time() + ttl)
        return
    r = await _get_redis()
    await r.setex(key, ttl, json.dumps(value))


async def flush_pattern(pattern: str) -> None:
    if not _use_redis():
        prefix = pattern.rstrip("*")
        for k in list(_mem.keys()):
            if k.startswith(prefix):
                del _mem[k]
        return
    r = await _get_redis()
    keys = await r.keys(pattern)
    if keys:
        await r.delete(*keys)

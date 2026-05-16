import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db
from scheduler import start_scheduler, stop_scheduler
from routers import scores, compute, compare, meta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seed if no scores exist yet
    try:
        from database import AsyncSessionLocal
        from models import FragilityScore
        from sqlalchemy import select, func
        async with AsyncSessionLocal() as session:
            row = await session.execute(select(func.count(FragilityScore.id)))
            count = row.scalar_one()
        if count == 0:
            logger.info("No scores found — running initial seed")
            from seed import refresh_once
            await refresh_once()
    except Exception as e:
        logger.warning("Auto-seed failed (run python seed.py manually): %s", e)

    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="SENRA API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scores.router)
app.include_router(compute.router)
app.include_router(compare.router)
app.include_router(meta.router)


@app.get("/")
async def root():
    return {"name": "SENRA API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

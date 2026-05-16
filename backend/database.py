import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Falls back to local SQLite — no Supabase needed for local dev
DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite+aiosqlite:///./senra.db"

_kwargs: dict = {}
if DATABASE_URL.startswith("sqlite"):
    _kwargs = {"connect_args": {"check_same_thread": False}}

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=not DATABASE_URL.startswith("sqlite"), **_kwargs)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

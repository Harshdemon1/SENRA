from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import DataRefreshLog, FragilityScore

router = APIRouter()


@router.get("/api/meta")
async def get_meta(db: AsyncSession = Depends(get_db)):
    log_row = await db.execute(
        select(DataRefreshLog).order_by(DataRefreshLog.ran_at.desc()).limit(1)
    )
    log = log_row.scalar_one_or_none()

    avg_conf_row = await db.execute(
        select(func.avg(FragilityScore.confidence)).where(
            FragilityScore.sector_preset == "default"
        )
    )
    avg_conf = avg_conf_row.scalar_one_or_none()

    count_row = await db.execute(
        select(func.count(FragilityScore.id)).where(
            FragilityScore.sector_preset == "default"
        )
    )
    total = count_row.scalar_one_or_none() or 0

    return {
        "last_updated": log.ran_at.isoformat() if log else None,
        "status": log.status if log else "unknown",
        "sources_ok": log.sources_ok if log else {},
        "states_count": log.states_count if log else 0,
        "avg_confidence": round(float(avg_conf), 1) if avg_conf else 0.0,
        "total_scores": total,
    }

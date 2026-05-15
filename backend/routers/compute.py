from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
from database import get_db
from models import State, RawDataSnapshot
from services import scorer

router = APIRouter()


class ComputeRequest(BaseModel):
    weights: dict[str, float]
    sector: str = "default"

    @field_validator("weights")
    @classmethod
    def weights_sum_to_one(cls, v: dict) -> dict:
        total = sum(v.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights must sum to 1.0, got {total:.3f}")
        return v


@router.post("/api/compute")
async def compute_custom(req: ComputeRequest, db: AsyncSession = Depends(get_db)):
    # Load latest snapshots
    rows = await db.execute(
        select(RawDataSnapshot, State)
        .join(State, State.id == RawDataSnapshot.state_id)
    )
    all_snaps = rows.all()

    # Keep only the latest snapshot per state
    latest: dict[int, tuple] = {}
    for snap, state in all_snaps:
        sid = state.id
        if sid not in latest or snap.snapshot_date > latest[sid][0].snapshot_date:
            latest[sid] = (snap, state)

    if not latest:
        raise HTTPException(503, "No snapshot data — run seed.py first")

    raw_data = {}
    state_meta = {}
    for snap, state in latest.values():
        raw_data[state.name] = {
            "road_quality":         float(snap.road_quality_raw) if snap.road_quality_raw else None,
            "business_density":     float(snap.business_density_raw) if snap.business_density_raw else None,
            "monsoon_disruption":   float(snap.monsoon_disruption_raw) if snap.monsoon_disruption_raw else None,
            "logistics_access":     float(snap.logistics_access_raw) if snap.logistics_access_raw else None,
            "power_reliability":    float(snap.power_reliability_raw) if snap.power_reliability_raw else None,
            "cold_chain_infra":     float(snap.cold_chain_infra_raw) if snap.cold_chain_infra_raw else None,
            "market_concentration": float(snap.market_concentration_raw) if snap.market_concentration_raw else None,
        }
        state_meta[state.name] = {"slug": state.slug, "iso_code": state.iso_code, "region": state.region}

    scores = scorer.compute_fragility_scores(
        raw_data=raw_data,
        weights=req.weights,
        region_map=scorer.REGION_MAP,
    )

    # Attach slug/iso_code/region
    for s in scores:
        meta = state_meta.get(s["state"], {})
        s["slug"] = meta.get("slug", "")
        s["iso_code"] = meta.get("iso_code", "")
        s["region"] = meta.get("region", "")

    return {"states": scores, "weights_used": req.weights}

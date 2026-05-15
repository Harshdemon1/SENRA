from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import State, FragilityScore, RawDataSnapshot
from services.cache import cache_get, cache_set
import json

router = APIRouter()


def _shape_score(fs: FragilityScore, state: State) -> dict:
    return {
        "state":    state.name,
        "slug":     state.slug,
        "iso_code": state.iso_code,
        "region":   state.region,
        "score":    float(fs.score),
        "rank":     fs.rank,
        "band":     fs.band,
        "confidence": float(fs.confidence),
        "subscores": {
            "road_quality":         float(fs.subscore_road or 0),
            "business_density":     float(fs.subscore_business or 0),
            "monsoon_disruption":   float(fs.subscore_monsoon or 0),
            "logistics_access":     float(fs.subscore_logistics or 0),
            "power_reliability":    float(fs.subscore_power or 0),
            "cold_chain_infra":     float(fs.subscore_cold_chain or 0),
            "market_concentration": float(fs.subscore_concentration or 0),
        },
        "imputed_dims": fs.imputed_dimensions or [],
    }


@router.get("/api/scores")
async def get_scores(
    sector: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"scores:{sector}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # Get latest computed_at for this preset
    latest_row = await db.execute(
        select(FragilityScore.computed_at)
        .where(FragilityScore.sector_preset == sector)
        .order_by(FragilityScore.computed_at.desc())
        .limit(1)
    )
    latest_at = latest_row.scalar_one_or_none()
    if latest_at is None:
        raise HTTPException(404, "No scores found — run seed.py first")

    rows = await db.execute(
        select(FragilityScore, State)
        .join(State, State.id == FragilityScore.state_id)
        .where(
            FragilityScore.sector_preset == sector,
            FragilityScore.computed_at == latest_at,
        )
        .order_by(FragilityScore.rank)
    )

    payload = {
        "sector":     sector,
        "updated_at": latest_at.isoformat(),
        "states":     [_shape_score(fs, st) for fs, st in rows.all()],
    }
    await cache_set(cache_key, payload, ttl=3600)
    return payload


@router.get("/api/scores/{slug}")
async def get_state_score(slug: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"state:{slug}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    state_row = await db.execute(select(State).where(State.slug == slug))
    state = state_row.scalar_one_or_none()
    if state is None:
        raise HTTPException(404, f"State '{slug}' not found")

    # Latest score for default preset
    latest_row = await db.execute(
        select(FragilityScore)
        .where(FragilityScore.state_id == state.id, FragilityScore.sector_preset == "default")
        .order_by(FragilityScore.computed_at.desc())
        .limit(1)
    )
    latest = latest_row.scalar_one_or_none()
    if latest is None:
        raise HTTPException(404, "No scores found for this state")

    shaped = _shape_score(latest, state)

    # Score history (last 12)
    history_rows = await db.execute(
        select(FragilityScore)
        .where(FragilityScore.state_id == state.id, FragilityScore.sector_preset == "default")
        .order_by(FragilityScore.computed_at.desc())
        .limit(12)
    )
    shaped["history"] = [
        {"date": r.computed_at.isoformat(), "score": float(r.score), "band": r.band}
        for r in history_rows.scalars()
    ]

    # Raw values from latest snapshot
    snap_row = await db.execute(
        select(RawDataSnapshot)
        .where(RawDataSnapshot.state_id == state.id)
        .order_by(RawDataSnapshot.snapshot_date.desc())
        .limit(1)
    )
    snap = snap_row.scalar_one_or_none()
    shaped["raw_values"] = {
        "road_quality":         float(snap.road_quality_raw) if snap and snap.road_quality_raw else None,
        "business_density":     float(snap.business_density_raw) if snap and snap.business_density_raw else None,
        "monsoon_disruption":   float(snap.monsoon_disruption_raw) if snap and snap.monsoon_disruption_raw else None,
        "logistics_access":     float(snap.logistics_access_raw) if snap and snap.logistics_access_raw else None,
        "power_reliability":    float(snap.power_reliability_raw) if snap and snap.power_reliability_raw else None,
        "cold_chain_infra":     float(snap.cold_chain_infra_raw) if snap and snap.cold_chain_infra_raw else None,
        "market_concentration": float(snap.market_concentration_raw) if snap and snap.market_concentration_raw else None,
    } if snap else {}

    # Similar states (3 closest by score)
    similar_rows = await db.execute(
        select(FragilityScore, State)
        .join(State, State.id == FragilityScore.state_id)
        .where(
            FragilityScore.sector_preset == "default",
            FragilityScore.computed_at == latest.computed_at,
            FragilityScore.state_id != state.id,
        )
        .order_by(
            (FragilityScore.score - latest.score) * (FragilityScore.score - latest.score)
        )
        .limit(3)
    )
    shaped["similar"] = [_shape_score(fs, st) for fs, st in similar_rows.all()]

    await cache_set(cache_key, shaped, ttl=3600)
    return shaped

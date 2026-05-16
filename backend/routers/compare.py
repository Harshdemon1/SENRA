from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import State, FragilityScore
from services.cache import cache_get, cache_set

router = APIRouter()


@router.get("/api/compare")
async def compare_states(
    states: str = Query(..., description="Comma-separated slugs, max 4"),
    sector: str = Query("default"),
    db: AsyncSession = Depends(get_db),
):
    slugs = [s.strip() for s in states.split(",")][:4]
    if len(slugs) < 2:
        raise HTTPException(400, "Need at least 2 states to compare")

    cache_key = f"compare:{sector}:{','.join(sorted(slugs))}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    # Get latest computed_at for sector
    latest_row = await db.execute(
        select(FragilityScore.computed_at)
        .where(FragilityScore.sector_preset == sector)
        .order_by(FragilityScore.computed_at.desc())
        .limit(1)
    )
    latest_at = latest_row.scalar_one_or_none()
    if not latest_at:
        raise HTTPException(404, "No scores found — run seed.py first")

    # Batch query 1: all states at once
    states_result = await db.execute(select(State).where(State.slug.in_(slugs)))
    states_map = {s.slug: s for s in states_result.scalars().all()}

    missing = [slug for slug in slugs if slug not in states_map]
    if missing:
        raise HTTPException(404, f"State(s) not found: {', '.join(missing)}")

    state_ids = [states_map[slug].id for slug in slugs]

    # Batch query 2: all scores at once
    fs_result = await db.execute(
        select(FragilityScore)
        .where(
            FragilityScore.state_id.in_(state_ids),
            FragilityScore.sector_preset == sector,
            FragilityScore.computed_at == latest_at,
        )
    )
    fs_map = {fs.state_id: fs for fs in fs_result.scalars().all()}

    result_states = []
    for slug in slugs:
        state = states_map[slug]
        fs = fs_map.get(state.id)
        if fs is None:
            raise HTTPException(404, f"No score for '{slug}' in sector '{sector}'")

        result_states.append({
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
        })

    # Dimension-level winners per key (lowest subscore = least fragile)
    dim_keys = [
        "road_quality", "business_density", "monsoon_disruption",
        "logistics_access", "power_reliability", "cold_chain_infra", "market_concentration"
    ]
    dimension_winners = {}
    for key in dim_keys:
        best = min(result_states, key=lambda s: s["subscores"][key])
        dimension_winners[key] = best["slug"]

    payload = {
        "sector":            sector,
        "states":            result_states,
        "dimension_winners": dimension_winners,
    }
    await cache_set(cache_key, payload, ttl=1800)
    return payload

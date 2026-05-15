"""
Run once to initialise the database and compute the first set of scores.
    python seed.py
"""
import asyncio
import os
from datetime import date
from dotenv import load_dotenv

load_dotenv()

from database import init_db, AsyncSessionLocal
from models import State, RawDataSnapshot, FragilityScore, DataRefreshLog
from services import fetcher, scorer
from services.cleaner import to_slug
from sqlalchemy import select

STATES_SEED = [
    {"name": "Andhra Pradesh",   "slug": "andhra-pradesh",   "iso_code": "IN-AP", "region": "South",     "is_ut": False, "area_sq_km": 162975,  "population": 49386799},
    {"name": "Arunachal Pradesh","slug": "arunachal-pradesh","iso_code": "IN-AR", "region": "Northeast", "is_ut": False, "area_sq_km": 83743,   "population": 1383727},
    {"name": "Assam",            "slug": "assam",             "iso_code": "IN-AS", "region": "Northeast", "is_ut": False, "area_sq_km": 78438,   "population": 31205576},
    {"name": "Bihar",            "slug": "bihar",             "iso_code": "IN-BR", "region": "East",      "is_ut": False, "area_sq_km": 94163,   "population": 104099452},
    {"name": "Chhattisgarh",     "slug": "chhattisgarh",     "iso_code": "IN-CT", "region": "Central",   "is_ut": False, "area_sq_km": 135192,  "population": 25545198},
    {"name": "Goa",              "slug": "goa",               "iso_code": "IN-GA", "region": "West",      "is_ut": False, "area_sq_km": 3702,    "population": 1458545},
    {"name": "Gujarat",          "slug": "gujarat",           "iso_code": "IN-GJ", "region": "West",      "is_ut": False, "area_sq_km": 196024,  "population": 60439692},
    {"name": "Haryana",          "slug": "haryana",           "iso_code": "IN-HR", "region": "North",     "is_ut": False, "area_sq_km": 44212,   "population": 25351462},
    {"name": "Himachal Pradesh", "slug": "himachal-pradesh",  "iso_code": "IN-HP", "region": "North",     "is_ut": False, "area_sq_km": 55673,   "population": 6864602},
    {"name": "Jharkhand",        "slug": "jharkhand",         "iso_code": "IN-JH", "region": "East",      "is_ut": False, "area_sq_km": 79716,   "population": 32988134},
    {"name": "Karnataka",        "slug": "karnataka",         "iso_code": "IN-KA", "region": "South",     "is_ut": False, "area_sq_km": 191791,  "population": 61095297},
    {"name": "Kerala",           "slug": "kerala",            "iso_code": "IN-KL", "region": "South",     "is_ut": False, "area_sq_km": 38852,   "population": 33406061},
    {"name": "Madhya Pradesh",   "slug": "madhya-pradesh",    "iso_code": "IN-MP", "region": "Central",   "is_ut": False, "area_sq_km": 308252,  "population": 72626809},
    {"name": "Maharashtra",      "slug": "maharashtra",       "iso_code": "IN-MH", "region": "West",      "is_ut": False, "area_sq_km": 307713,  "population": 112374333},
    {"name": "Manipur",          "slug": "manipur",           "iso_code": "IN-MN", "region": "Northeast", "is_ut": False, "area_sq_km": 22327,   "population": 2855794},
    {"name": "Meghalaya",        "slug": "meghalaya",         "iso_code": "IN-ML", "region": "Northeast", "is_ut": False, "area_sq_km": 22429,   "population": 2966889},
    {"name": "Mizoram",          "slug": "mizoram",           "iso_code": "IN-MZ", "region": "Northeast", "is_ut": False, "area_sq_km": 21081,   "population": 1097206},
    {"name": "Nagaland",         "slug": "nagaland",          "iso_code": "IN-NL", "region": "Northeast", "is_ut": False, "area_sq_km": 16579,   "population": 1978502},
    {"name": "Odisha",           "slug": "odisha",            "iso_code": "IN-OD", "region": "East",      "is_ut": False, "area_sq_km": 155707,  "population": 41974218},
    {"name": "Punjab",           "slug": "punjab",            "iso_code": "IN-PB", "region": "North",     "is_ut": False, "area_sq_km": 50362,   "population": 27743338},
    {"name": "Rajasthan",        "slug": "rajasthan",         "iso_code": "IN-RJ", "region": "North",     "is_ut": False, "area_sq_km": 342239,  "population": 68548437},
    {"name": "Sikkim",           "slug": "sikkim",            "iso_code": "IN-SK", "region": "Northeast", "is_ut": False, "area_sq_km": 7096,    "population": 610577},
    {"name": "Tamil Nadu",       "slug": "tamil-nadu",        "iso_code": "IN-TN", "region": "South",     "is_ut": False, "area_sq_km": 130058,  "population": 72147030},
    {"name": "Telangana",        "slug": "telangana",         "iso_code": "IN-TS", "region": "South",     "is_ut": False, "area_sq_km": 112077,  "population": 35003674},
    {"name": "Tripura",          "slug": "tripura",           "iso_code": "IN-TR", "region": "Northeast", "is_ut": False, "area_sq_km": 10486,   "population": 3673917},
    {"name": "Uttar Pradesh",    "slug": "uttar-pradesh",     "iso_code": "IN-UP", "region": "North",     "is_ut": False, "area_sq_km": 240928,  "population": 199812341},
    {"name": "Uttarakhand",      "slug": "uttarakhand",       "iso_code": "IN-UT", "region": "North",     "is_ut": False, "area_sq_km": 53483,   "population": 10086292},
    {"name": "West Bengal",      "slug": "west-bengal",       "iso_code": "IN-WB", "region": "East",      "is_ut": False, "area_sq_km": 88752,   "population": 91276115},
    {"name": "Andaman and Nicobar Islands",             "slug": "andaman-and-nicobar-islands",            "iso_code": "IN-AN", "region": "Northeast", "is_ut": True, "area_sq_km": 8249,   "population": 380581},
    {"name": "Chandigarh",       "slug": "chandigarh",        "iso_code": "IN-CH", "region": "North",     "is_ut": True,  "area_sq_km": 114,     "population": 1055450},
    {"name": "Dadra and Nagar Haveli and Daman and Diu","slug": "dadra-and-nagar-haveli-and-daman-and-diu","iso_code": "IN-DH", "region": "West",      "is_ut": True, "area_sq_km": 603,    "population": 586956},
    {"name": "Delhi",            "slug": "delhi",             "iso_code": "IN-DL", "region": "North",     "is_ut": True,  "area_sq_km": 1484,    "population": 16787941},
    {"name": "Jammu and Kashmir","slug": "jammu-and-kashmir", "iso_code": "IN-JK", "region": "North",     "is_ut": True,  "area_sq_km": 42241,   "population": 12541302},
    {"name": "Ladakh",           "slug": "ladakh",            "iso_code": "IN-LA", "region": "North",     "is_ut": True,  "area_sq_km": 59146,   "population": 274289},
    {"name": "Lakshadweep",      "slug": "lakshadweep",       "iso_code": "IN-LD", "region": "South",     "is_ut": True,  "area_sq_km": 32,      "population": 64473},
    {"name": "Puducherry",       "slug": "puducherry",        "iso_code": "IN-PY", "region": "South",     "is_ut": True,  "area_sq_km": 479,     "population": 1247953},
]


async def upsert_states(session) -> dict[str, int]:
    """Upsert all 36 states, return {name: id} map."""
    name_to_id: dict[str, int] = {}
    for s in STATES_SEED:
        existing = await session.execute(select(State).where(State.name == s["name"]))
        obj = existing.scalar_one_or_none()
        if obj is None:
            obj = State(**s)
            session.add(obj)
            await session.flush()
        else:
            for k, v in s.items():
                setattr(obj, k, v)
        name_to_id[s["name"]] = obj.id
    await session.commit()
    # re-query to get IDs after commit
    result = await session.execute(select(State))
    for row in result.scalars():
        name_to_id[row.name] = row.id
    return name_to_id


async def refresh_once():
    raw_data, sources_ok = await fetcher.fetch_all()
    today = date.today()

    async with AsyncSessionLocal() as session:
        name_to_id = await upsert_states(session)

        # Save raw snapshots
        for state_name, dims in raw_data.items():
            state_id = name_to_id.get(state_name)
            if not state_id:
                continue
            existing = await session.execute(
                select(RawDataSnapshot).where(
                    RawDataSnapshot.state_id == state_id,
                    RawDataSnapshot.snapshot_date == today,
                )
            )
            snap = existing.scalar_one_or_none()
            completeness = sum(1 for v in dims.values() if v is not None) / 7
            data = {
                "state_id": state_id,
                "snapshot_date": today,
                "road_quality_raw": dims.get("road_quality"),
                "business_density_raw": dims.get("business_density"),
                "monsoon_disruption_raw": dims.get("monsoon_disruption"),
                "logistics_access_raw": dims.get("logistics_access"),
                "power_reliability_raw": dims.get("power_reliability"),
                "cold_chain_infra_raw": dims.get("cold_chain_infra"),
                "market_concentration_raw": dims.get("market_concentration"),
                "data_completeness": completeness,
                "sources_used": {k: "fallback" if not sources_ok.get(k) else "live"
                                 for k in sources_ok},
            }
            if snap is None:
                session.add(RawDataSnapshot(**data))
            else:
                for k, v in data.items():
                    setattr(snap, k, v)

        await session.flush()

        # Compute + save scores for all sector presets
        from datetime import datetime
        now = datetime.now()
        for preset_name, weights in scorer.SECTOR_PRESETS.items():
            scores = scorer.compute_fragility_scores(
                raw_data=raw_data,
                weights=weights,
                region_map=scorer.REGION_MAP,
            )
            for s in scores:
                state_id = name_to_id.get(s["state"])
                if not state_id:
                    continue
                existing = await session.execute(
                    select(FragilityScore).where(
                        FragilityScore.state_id == state_id,
                        FragilityScore.sector_preset == preset_name,
                    ).order_by(FragilityScore.computed_at.desc()).limit(1)
                )
                fs = FragilityScore(
                    state_id=state_id,
                    computed_at=now,
                    score=s["score"],
                    rank=s["rank"],
                    band=s["band"],
                    confidence=s["confidence"],
                    subscore_road=s["subscores"].get("road_quality"),
                    subscore_business=s["subscores"].get("business_density"),
                    subscore_monsoon=s["subscores"].get("monsoon_disruption"),
                    subscore_logistics=s["subscores"].get("logistics_access"),
                    subscore_power=s["subscores"].get("power_reliability"),
                    subscore_cold_chain=s["subscores"].get("cold_chain_infra"),
                    subscore_concentration=s["subscores"].get("market_concentration"),
                    imputed_dimensions=s.get("imputed_dims", []),
                    sector_preset=preset_name,
                )
                session.add(fs)

        # Log refresh
        session.add(DataRefreshLog(
            status="success",
            sources_ok=sources_ok,
            states_count=len(raw_data),
        ))
        await session.commit()
        print(f"Seed complete — {len(raw_data)} states, {len(scorer.SECTOR_PRESETS)} presets")


async def main():
    await init_db()
    await refresh_once()


if __name__ == "__main__":
    asyncio.run(main())

import os
import logging
import asyncio
import httpx
from services.cleaner import coerce_float

logger = logging.getLogger(__name__)

# data.gov.in resource IDs - verify at data.gov.in if they 404
_RESOURCE_IDS = {
    "nh_length_by_state":     "c5e0663b-5a64-4f77-9c75-e2b1eb4fce27",
    "mca_companies_by_state": "9ef84268-d588-465a-a308-a864a43d0070",
    "cold_storage_nhb":       "5db0bfc8-9741-4944-9734-e4c7de35b7e5",
    "power_deficit_cea":      "e4a7d450-5a25-4b65-a97a-2a4b79c3d48b",
}

# ── Fallback data (2023-24 estimates from public sources) ──────────────────
# road_quality: NH km per 1000 sq km (higher = better road density)
_FALLBACK_ROAD: dict[str, float] = {
    "Andhra Pradesh": 38.0, "Arunachal Pradesh": 10.0, "Assam": 25.0,
    "Bihar": 28.0, "Chhattisgarh": 18.0, "Goa": 85.0, "Gujarat": 45.0,
    "Haryana": 68.0, "Himachal Pradesh": 22.0, "Jharkhand": 20.0,
    "Karnataka": 35.0, "Kerala": 30.0, "Madhya Pradesh": 22.0,
    "Maharashtra": 38.0, "Manipur": 18.0, "Meghalaya": 22.0,
    "Mizoram": 15.0, "Nagaland": 18.0, "Odisha": 25.0, "Punjab": 72.0,
    "Rajasthan": 15.0, "Sikkim": 15.0, "Tamil Nadu": 42.0,
    "Telangana": 40.0, "Tripura": 35.0, "Uttar Pradesh": 32.0,
    "Uttarakhand": 24.0, "West Bengal": 48.0,
    "Andaman and Nicobar Islands": 12.0, "Chandigarh": 120.0,
    "Dadra and Nagar Haveli and Daman and Diu": 70.0, "Delhi": 150.0,
    "Jammu and Kashmir": 18.0, "Ladakh": 8.0, "Lakshadweep": 5.0,
    "Puducherry": 90.0,
}

# business_density: registered companies per lakh population (higher = better)
_FALLBACK_BUSINESS: dict[str, float] = {
    "Andhra Pradesh": 280.0, "Arunachal Pradesh": 70.0, "Assam": 110.0,
    "Bihar": 80.0, "Chhattisgarh": 140.0, "Goa": 380.0, "Gujarat": 490.0,
    "Haryana": 320.0, "Himachal Pradesh": 180.0, "Jharkhand": 100.0,
    "Karnataka": 450.0, "Kerala": 310.0, "Madhya Pradesh": 180.0,
    "Maharashtra": 580.0, "Manipur": 90.0, "Meghalaya": 100.0,
    "Mizoram": 85.0, "Nagaland": 75.0, "Odisha": 130.0, "Punjab": 310.0,
    "Rajasthan": 240.0, "Sikkim": 120.0, "Tamil Nadu": 420.0,
    "Telangana": 350.0, "Tripura": 95.0, "Uttar Pradesh": 160.0,
    "Uttarakhand": 200.0, "West Bengal": 260.0,
    "Andaman and Nicobar Islands": 80.0, "Chandigarh": 800.0,
    "Dadra and Nagar Haveli and Daman and Diu": 280.0, "Delhi": 1200.0,
    "Jammu and Kashmir": 150.0, "Ladakh": 60.0, "Lakshadweep": 40.0,
    "Puducherry": 350.0,
}

# monsoon_disruption: composite 0–100 (higher = more disruptive)
_FALLBACK_MONSOON: dict[str, float] = {
    "Andhra Pradesh": 55.0, "Arunachal Pradesh": 78.0, "Assam": 88.0,
    "Bihar": 82.0, "Chhattisgarh": 58.0, "Goa": 60.0, "Gujarat": 52.0,
    "Haryana": 38.0, "Himachal Pradesh": 42.0, "Jharkhand": 65.0,
    "Karnataka": 48.0, "Kerala": 68.0, "Madhya Pradesh": 55.0,
    "Maharashtra": 50.0, "Manipur": 82.0, "Meghalaya": 90.0,
    "Mizoram": 80.0, "Nagaland": 76.0, "Odisha": 72.0, "Punjab": 38.0,
    "Rajasthan": 45.0, "Sikkim": 78.0, "Tamil Nadu": 52.0,
    "Telangana": 50.0, "Tripura": 80.0, "Uttar Pradesh": 62.0,
    "Uttarakhand": 55.0, "West Bengal": 75.0,
    "Andaman and Nicobar Islands": 72.0, "Chandigarh": 30.0,
    "Dadra and Nagar Haveli and Daman and Diu": 55.0, "Delhi": 32.0,
    "Jammu and Kashmir": 45.0, "Ladakh": 15.0, "Lakshadweep": 65.0,
    "Puducherry": 50.0,
}

# logistics_access: LEADS score 0–100 (higher = better logistics)
_FALLBACK_LEADS: dict[str, float] = {
    "Andhra Pradesh": 76.0, "Arunachal Pradesh": 32.0, "Assam": 46.0,
    "Bihar": 42.0, "Chhattisgarh": 48.0, "Goa": 62.0, "Gujarat": 74.0,
    "Haryana": 65.0, "Himachal Pradesh": 52.0, "Jharkhand": 44.0,
    "Karnataka": 70.0, "Kerala": 66.0, "Madhya Pradesh": 52.0,
    "Maharashtra": 72.0, "Manipur": 38.0, "Meghalaya": 40.0,
    "Mizoram": 36.0, "Nagaland": 35.0, "Odisha": 55.0, "Punjab": 68.0,
    "Rajasthan": 60.0, "Sikkim": 38.0, "Tamil Nadu": 74.0,
    "Telangana": 72.0, "Tripura": 42.0, "Uttar Pradesh": 54.0,
    "Uttarakhand": 50.0, "West Bengal": 58.0,
    "Andaman and Nicobar Islands": 35.0, "Chandigarh": 65.0,
    "Dadra and Nagar Haveli and Daman and Diu": 55.0, "Delhi": 70.0,
    "Jammu and Kashmir": 45.0, "Ladakh": 28.0, "Lakshadweep": 25.0,
    "Puducherry": 60.0,
}

# power_reliability: avg annual outage hours (higher = worse)
_FALLBACK_POWER: dict[str, float] = {
    "Andhra Pradesh": 110.0, "Arunachal Pradesh": 700.0, "Assam": 500.0,
    "Bihar": 900.0, "Chhattisgarh": 350.0, "Goa": 120.0, "Gujarat": 80.0,
    "Haryana": 150.0, "Himachal Pradesh": 180.0, "Jharkhand": 750.0,
    "Karnataka": 95.0, "Kerala": 85.0, "Madhya Pradesh": 380.0,
    "Maharashtra": 100.0, "Manipur": 650.0, "Meghalaya": 550.0,
    "Mizoram": 580.0, "Nagaland": 600.0, "Odisha": 450.0, "Punjab": 120.0,
    "Rajasthan": 350.0, "Sikkim": 400.0, "Tamil Nadu": 90.0,
    "Telangana": 105.0, "Tripura": 480.0, "Uttar Pradesh": 600.0,
    "Uttarakhand": 200.0, "West Bengal": 300.0,
    "Andaman and Nicobar Islands": 350.0, "Chandigarh": 30.0,
    "Dadra and Nagar Haveli and Daman and Diu": 150.0, "Delhi": 50.0,
    "Jammu and Kashmir": 400.0, "Ladakh": 500.0, "Lakshadweep": 300.0,
    "Puducherry": 100.0,
}

# cold_chain_infra: MT cold storage capacity per lakh population (higher = better)
_FALLBACK_COLD: dict[str, float] = {
    "Andhra Pradesh": 250.0, "Arunachal Pradesh": 25.0, "Assam": 55.0,
    "Bihar": 80.0, "Chhattisgarh": 70.0, "Goa": 90.0, "Gujarat": 290.0,
    "Haryana": 320.0, "Himachal Pradesh": 180.0, "Jharkhand": 60.0,
    "Karnataka": 180.0, "Kerala": 120.0, "Madhya Pradesh": 220.0,
    "Maharashtra": 280.0, "Manipur": 35.0, "Meghalaya": 40.0,
    "Mizoram": 30.0, "Nagaland": 28.0, "Odisha": 100.0, "Punjab": 480.0,
    "Rajasthan": 200.0, "Sikkim": 20.0, "Tamil Nadu": 200.0,
    "Telangana": 210.0, "Tripura": 50.0, "Uttar Pradesh": 850.0,
    "Uttarakhand": 150.0, "West Bengal": 450.0,
    "Andaman and Nicobar Islands": 45.0, "Chandigarh": 200.0,
    "Dadra and Nagar Haveli and Daman and Diu": 100.0, "Delhi": 230.0,
    "Jammu and Kashmir": 80.0, "Ladakh": 30.0, "Lakshadweep": 15.0,
    "Puducherry": 80.0,
}

# market_concentration: HHI proxy 0–1 (higher = more concentrated = worse)
_FALLBACK_HHI: dict[str, float] = {
    "Andhra Pradesh": 0.22, "Arunachal Pradesh": 0.70, "Assam": 0.60,
    "Bihar": 0.50, "Chhattisgarh": 0.45, "Goa": 0.42, "Gujarat": 0.20,
    "Haryana": 0.28, "Himachal Pradesh": 0.52, "Jharkhand": 0.55,
    "Karnataka": 0.18, "Kerala": 0.28, "Madhya Pradesh": 0.38,
    "Maharashtra": 0.15, "Manipur": 0.68, "Meghalaya": 0.65,
    "Mizoram": 0.75, "Nagaland": 0.72, "Odisha": 0.42, "Punjab": 0.25,
    "Rajasthan": 0.35, "Sikkim": 0.78, "Tamil Nadu": 0.18,
    "Telangana": 0.24, "Tripura": 0.62, "Uttar Pradesh": 0.40,
    "Uttarakhand": 0.48, "West Bengal": 0.30,
    "Andaman and Nicobar Islands": 0.88, "Chandigarh": 0.30,
    "Dadra and Nagar Haveli and Daman and Diu": 0.75, "Delhi": 0.12,
    "Jammu and Kashmir": 0.55, "Ladakh": 0.85, "Lakshadweep": 0.92,
    "Puducherry": 0.35,
}

_DATA_GOV_BASE = "https://api.data.gov.in/resource"


async def _fetch_data_gov(resource_id: str) -> list[dict]:
    api_key = os.getenv("DATA_GOV_IN_API_KEY", "")
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{_DATA_GOV_BASE}/{resource_id}",
            params={"api-key": api_key, "format": "json", "limit": 1000},
        )
        r.raise_for_status()
        return r.json().get("records", [])


async def fetch_road_quality() -> dict[str, float]:
    if os.getenv("USE_LIVE_DATA") != "true":
        return _FALLBACK_ROAD
    try:
        records = await _fetch_data_gov(_RESOURCE_IDS["nh_length_by_state"])
        result: dict[str, float] = {}
        for rec in records:
            state = rec.get("state_name") or rec.get("State")
            val = coerce_float(rec.get("nh_km") or rec.get("length_km"))
            if state and val is not None:
                result[state] = val
        return result or _FALLBACK_ROAD
    except Exception as e:
        logger.warning("Road quality fetch failed: %s — using fallback", e)
        return _FALLBACK_ROAD


async def fetch_business_density() -> dict[str, float]:
    if os.getenv("USE_LIVE_DATA") != "true":
        return _FALLBACK_BUSINESS
    try:
        records = await _fetch_data_gov(_RESOURCE_IDS["mca_companies_by_state"])
        result: dict[str, float] = {}
        for rec in records:
            state = rec.get("state") or rec.get("State_Name")
            val = coerce_float(rec.get("total_companies") or rec.get("count"))
            if state and val is not None:
                result[state] = val
        return result or _FALLBACK_BUSINESS
    except Exception as e:
        logger.warning("Business density fetch failed: %s — using fallback", e)
        return _FALLBACK_BUSINESS


async def fetch_monsoon_disruption() -> dict[str, float]:
    # IMD does not have a clean REST API; fallback is always used unless extended
    if os.getenv("USE_LIVE_DATA") != "true":
        return _FALLBACK_MONSOON
    logger.info("IMD rainfall: using fallback (no public REST API)")
    return _FALLBACK_MONSOON


async def fetch_leads() -> dict[str, float]:
    # LEADS PDF parsed at seed time; return cached fallback values here
    return _FALLBACK_LEADS


async def fetch_power_reliability() -> dict[str, float]:
    if os.getenv("USE_LIVE_DATA") != "true":
        return _FALLBACK_POWER
    try:
        records = await _fetch_data_gov(_RESOURCE_IDS["power_deficit_cea"])
        result: dict[str, float] = {}
        for rec in records:
            state = rec.get("state") or rec.get("State")
            val = coerce_float(rec.get("outage_hours") or rec.get("hours"))
            if state and val is not None:
                result[state] = val
        return result or _FALLBACK_POWER
    except Exception as e:
        logger.warning("Power reliability fetch failed: %s — using fallback", e)
        return _FALLBACK_POWER


async def fetch_cold_chain() -> dict[str, float]:
    if os.getenv("USE_LIVE_DATA") != "true":
        return _FALLBACK_COLD
    try:
        records = await _fetch_data_gov(_RESOURCE_IDS["cold_storage_nhb"])
        result: dict[str, float] = {}
        for rec in records:
            state = rec.get("state") or rec.get("State_Name")
            val = coerce_float(rec.get("capacity_mt") or rec.get("total_mt"))
            if state and val is not None:
                result[state] = val
        return result or _FALLBACK_COLD
    except Exception as e:
        logger.warning("Cold chain fetch failed: %s — using fallback", e)
        return _FALLBACK_COLD


async def fetch_market_concentration() -> dict[str, float]:
    # Derived from business density data; use precomputed fallback
    return _FALLBACK_HHI


async def fetch_all() -> tuple[dict, dict]:
    results = await asyncio.gather(
        fetch_road_quality(),
        fetch_business_density(),
        fetch_monsoon_disruption(),
        fetch_leads(),
        fetch_power_reliability(),
        fetch_cold_chain(),
        fetch_market_concentration(),
        return_exceptions=True,
    )

    keys = [
        "road_quality", "business_density", "monsoon_disruption",
        "logistics_access", "power_reliability", "cold_chain_infra",
        "market_concentration",
    ]
    fallbacks = [
        _FALLBACK_ROAD, _FALLBACK_BUSINESS, _FALLBACK_MONSOON,
        _FALLBACK_LEADS, _FALLBACK_POWER, _FALLBACK_COLD, _FALLBACK_HHI,
    ]

    dim_data: dict[str, dict] = {}
    sources_ok: dict[str, bool] = {}

    for key, res, fallback in zip(keys, results, fallbacks):
        if isinstance(res, Exception):
            logger.warning("Source %s failed: %s", key, res)
            dim_data[key] = fallback
            sources_ok[key] = False
        else:
            dim_data[key] = res
            sources_ok[key] = True

    # Merge into {state: {dim_key: value}}
    all_states = set(_FALLBACK_ROAD.keys())
    raw_data: dict[str, dict] = {s: {} for s in all_states}

    for dim_key, state_vals in dim_data.items():
        for state, val in state_vals.items():
            if state in raw_data:
                raw_data[state][dim_key] = val

    return raw_data, sources_ok

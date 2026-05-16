from dataclasses import dataclass
import numpy as np

REGION_MAP = {
    "Andhra Pradesh": "South", "Arunachal Pradesh": "Northeast", "Assam": "Northeast",
    "Bihar": "East", "Chhattisgarh": "Central", "Goa": "West",
    "Gujarat": "West", "Haryana": "North", "Himachal Pradesh": "North",
    "Jharkhand": "East", "Karnataka": "South", "Kerala": "South",
    "Madhya Pradesh": "Central", "Maharashtra": "West", "Manipur": "Northeast",
    "Meghalaya": "Northeast", "Mizoram": "Northeast", "Nagaland": "Northeast",
    "Odisha": "East", "Punjab": "North", "Rajasthan": "North",
    "Sikkim": "Northeast", "Tamil Nadu": "South", "Telangana": "South",
    "Tripura": "Northeast", "Uttar Pradesh": "North", "Uttarakhand": "North",
    "West Bengal": "East", "Andaman and Nicobar Islands": "Northeast",
    "Chandigarh": "North", "Dadra and Nagar Haveli and Daman and Diu": "West",
    "Delhi": "North", "Jammu and Kashmir": "North", "Ladakh": "North",
    "Lakshadweep": "South", "Puducherry": "South",
}


@dataclass
class Dimension:
    key: str
    label: str
    default_weight: float
    higher_is_worse: bool
    unit: str
    description: str


DIMENSIONS = [
    Dimension("road_quality",         "Road Infrastructure",       0.22, False, "NH km per 1000 sq km",  "National highway density as proxy for road quality"),
    Dimension("business_density",     "Distributor Density",       0.18, False, "Companies per lakh pop", "Registered distributor/wholesale businesses per capita"),
    Dimension("monsoon_disruption",   "Monsoon Disruption Risk",   0.18, True,  "Composite index",        "Rainfall volume, variability, and flood frequency"),
    Dimension("logistics_access",     "Logistics Access (LEADS)",  0.16, False, "LEADS score 0-100",      "Government LEADS index: port, warehouse, service quality"),
    Dimension("power_reliability",    "Power Grid Reliability",    0.12, True,  "Annual outage hours",    "Average annual power outage duration per consumer"),
    Dimension("cold_chain_infra",     "Cold Chain Infrastructure", 0.08, False, "MT capacity per lakh",   "Cold storage capacity relative to population"),
    Dimension("market_concentration", "Distributor Concentration", 0.06, True,  "HHI proxy",              "Market concentration of distributors (higher = riskier)"),
]

DEFAULT_WEIGHTS = {d.key: d.default_weight for d in DIMENSIONS}

SECTOR_PRESETS = {
    "default": {
        "road_quality": 0.22, "business_density": 0.18, "monsoon_disruption": 0.18,
        "logistics_access": 0.16, "power_reliability": 0.12, "cold_chain_infra": 0.08,
        "market_concentration": 0.06,
    },
    "fmcg": {
        "road_quality": 0.28, "business_density": 0.26, "monsoon_disruption": 0.15,
        "logistics_access": 0.13, "power_reliability": 0.07, "cold_chain_infra": 0.05,
        "market_concentration": 0.06,
    },
    "pharma": {
        "road_quality": 0.14, "business_density": 0.10, "monsoon_disruption": 0.12,
        "logistics_access": 0.20, "power_reliability": 0.20, "cold_chain_infra": 0.20,
        "market_concentration": 0.04,
    },
    "cold_chain": {
        "road_quality": 0.13, "business_density": 0.08, "monsoon_disruption": 0.13,
        "logistics_access": 0.16, "power_reliability": 0.24, "cold_chain_infra": 0.22,
        "market_concentration": 0.04,
    },
    "ecommerce": {
        "road_quality": 0.22, "business_density": 0.30, "monsoon_disruption": 0.16,
        "logistics_access": 0.14, "power_reliability": 0.09, "cold_chain_infra": 0.03,
        "market_concentration": 0.06,
    },
    "agriculture": {
        "road_quality": 0.18, "business_density": 0.10, "monsoon_disruption": 0.30,
        "logistics_access": 0.14, "power_reliability": 0.10, "cold_chain_infra": 0.14,
        "market_concentration": 0.04,
    },
}


def normalize_dimension(values: np.ndarray, higher_is_worse: bool, clip_percentiles: tuple = (5, 95)) -> np.ndarray:
    p5 = np.nanpercentile(values, clip_percentiles[0])
    p95 = np.nanpercentile(values, clip_percentiles[1])

    if p95 == p5:
        return np.full_like(values, 50.0, dtype=float)

    clipped = np.clip(values, p5, p95)
    normed = (clipped - p5) / (p95 - p5)

    if not higher_is_worse:
        normed = 1.0 - normed

    return normed * 100.0


def impute_missing(values: np.ndarray, state_names: list, dim_key: str, region_map: dict) -> tuple:
    imputed = values.copy().astype(float)
    is_imputed = np.zeros(len(values), dtype=bool)

    nan_indices = np.where(np.isnan(imputed))[0]
    for idx in nan_indices:
        state = state_names[idx]
        region = region_map.get(state, "Unknown")

        regional_indices = [
            i for i, s in enumerate(state_names)
            if region_map.get(s) == region and not np.isnan(values[i])
        ]
        if regional_indices:
            imputed[idx] = np.median(values[regional_indices])
        else:
            imputed[idx] = np.nanmedian(values)

        is_imputed[idx] = True

    return imputed, is_imputed


def _score_to_band(score: float) -> str:
    if score >= 70:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 30:
        return "MODERATE"
    return "LOW"


def _assign_bands_by_percentile(results: list) -> list:
    """
    Assign risk bands by rank position rather than fixed score thresholds.
    Results must be sorted by score descending before calling.
    Top 20% = CRITICAL, next 30% = HIGH, next 30% = MODERATE, bottom 20% = LOW.
    Falls back to fixed thresholds if fewer than 5 states.
    """
    n = len(results)
    if n < 5:
        for r in results:
            r["band"] = _score_to_band(r["score"])
        return results

    critical_n = max(1, round(n * 0.20))
    high_n     = max(1, round(n * 0.30))
    moderate_n = max(1, round(n * 0.30))

    for i, r in enumerate(results):
        if i < critical_n:
            r["band"] = "CRITICAL"
        elif i < critical_n + high_n:
            r["band"] = "HIGH"
        elif i < critical_n + high_n + moderate_n:
            r["band"] = "MODERATE"
        else:
            r["band"] = "LOW"
    return results


def compute_fragility_scores(
    raw_data: dict,
    weights: dict | None = None,
    region_map: dict | None = None,
) -> list:
    if weights is None:
        weights = DEFAULT_WEIGHTS

    total = sum(weights.values())
    if abs(total - 1.0) > 0.01:
        raise ValueError(f"Weights must sum to 1.0, got {total:.3f}")

    states = list(raw_data.keys())

    dim_normed = {}
    dim_imputed = {}

    for dim in DIMENSIONS:
        raw_vals = np.array(
            [raw_data[s].get(dim.key, np.nan) for s in states],
            dtype=float,
        )
        imputed_vals, is_imputed = impute_missing(raw_vals, states, dim.key, region_map or {})
        normed = normalize_dimension(imputed_vals, dim.higher_is_worse)
        dim_normed[dim.key] = normed
        dim_imputed[dim.key] = is_imputed

    results = []
    for i, state in enumerate(states):
        subscores = {dim.key: float(dim_normed[dim.key][i]) for dim in DIMENSIONS}
        composite = sum(subscores[k] * weights[k] for k in weights)

        imputed_count = sum(dim_imputed[dim.key][i] for dim in DIMENSIONS)
        confidence = (1.0 - imputed_count / len(DIMENSIONS)) * 100.0

        results.append({
            "state":        state,
            "score":        round(composite, 2),
            "rank":         None,
            "band":         "",
            "confidence":   round(confidence, 1),
            "subscores":    {k: round(v, 2) for k, v in subscores.items()},
            "raw_values":   raw_data[state],
            "imputed_dims": [dim.key for dim in DIMENSIONS if dim_imputed[dim.key][i]],
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    for rank, r in enumerate(results, start=1):
        r["rank"] = rank

    _assign_bands_by_percentile(results)

    return results

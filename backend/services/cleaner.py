import re


_NAME_VARIANTS = {
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "nct of delhi": "Delhi",
    "national capital territory of delhi": "Delhi",
    "j&k": "Jammu and Kashmir",
    "j & k": "Jammu and Kashmir",
    "uttaranchal": "Uttarakhand",
    "uattar pradesh": "Uttar Pradesh",
    "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "a & n islands": "Andaman and Nicobar Islands",
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "d & n haveli": "Dadra and Nagar Haveli and Daman and Diu",
}

_CANONICAL_NAMES = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "andaman and nicobar islands", "chandigarh",
    "dadra and nagar haveli and daman and diu", "delhi",
    "jammu and kashmir", "ladakh", "lakshadweep", "puducherry",
}


def clean_state_name(raw: str) -> str | None:
    stripped = re.sub(r"[\*†‡].*$", "", str(raw)).strip()
    stripped = re.sub(r"\s*\(UT\)\s*", "", stripped, flags=re.IGNORECASE).strip()
    lower = stripped.lower()
    if lower in _NAME_VARIANTS:
        return _NAME_VARIANTS[lower]
    if lower in _CANONICAL_NAMES:
        return stripped.title() if stripped.islower() else stripped
    # Fuzzy: title-cased match
    titled = stripped.title()
    if titled.lower() in _CANONICAL_NAMES:
        return titled
    return None


def to_slug(name: str) -> str:
    return re.sub(r"[\s&]+", "-", name.lower()).strip("-")


def coerce_float(x) -> float | None:
    if x is None:
        return None
    s = str(x).strip().replace(",", "")
    if s in ("", "NA", "N/A", "-", "–", "nan", "NaN"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def merge_state_dicts(*sources: dict) -> dict:
    """
    Merge per-dimension source dicts into scorer's expected format:
    { state_display_name: { dim_key: value | None } }
    """
    merged: dict[str, dict] = {}
    for source in sources:
        for state, values in source.items():
            if state not in merged:
                merged[state] = {}
            if isinstance(values, dict):
                merged[state].update(values)
            else:
                # source is {state: scalar} for single-dim sources
                # The caller must wrap it correctly
                pass
    return merged

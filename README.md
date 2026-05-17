# SENRA — Supply Chain Risk Intelligence

> The first public, algorithmically-derived ranking of retail supply chain fragility across all 28 Indian states and 8 Union Territories.

**[Live App →](https://senra.vercel.app)** | **[Methodology →](/methodology)**

---

## What It Does

A decision-support tool for logistics directors, VC analysts, and policy researchers. It computes a **Supply Chain Fragility Score** for every Indian state and UT across 7 dimensions of risk — road infrastructure, distributor density, monsoon disruption, logistics access, power reliability, cold chain infrastructure, and market concentration.

- **Interactive choropleth map** — colour-coded by risk band (CRITICAL / HIGH / MODERATE / LOW)
- **Live weight adjustment** — drag 7 sliders to reweight dimensions for your sector (FMCG, Pharma, Cold Chain, etc.)
- **State drill-down** — full profile with radar chart, trend history, and raw data
- **Compare tool** — side-by-side comparison of up to 4 states

---

## Architecture

Single Next.js process. No Python. No external database.

```
Browser  →  Next.js (port 3000)
                ├── /api/scores      — ranked fragility scores
                ├── /api/scores/:slug — full state profile
                ├── /api/compare     — multi-state comparison
                ├── /api/compute     — custom weight recompute
                └── /api/meta        — data freshness metadata
                        ↓
                   better-sqlite3 (senra.db — auto-created on first request)
```

---

## Quick Start

### Windows — one double-click

```
start.bat
```

### macOS / Linux — one command

```bash
chmod +x start.sh && ./start.sh
```

That's it. Opens `http://localhost:3000`. The database is created automatically on first load — no setup, no accounts, no environment variables needed.

---

### Manual setup

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Data Sources

| Source | Dimension | Cadence | Fallback |
|---|---|---|---|
| MoRTH / data.gov.in | Road Infrastructure | Annual | Yes |
| MCA21 / data.gov.in | Distributor Density | Monthly | Yes |
| IMD Rainfall Dataset | Monsoon Disruption | Monthly | Yes |
| MoCI LEADS PDF | Logistics Access | Annual | Yes |
| CEA / PFC Reports | Power Reliability | Annual | Yes |
| NHB / data.gov.in | Cold Chain Infra | Annual | Yes |

> All sources are publicly available under India's NDSAP (National Data Sharing and Accessibility Policy).

---

## Scoring Methodology

See [/methodology](/methodology) for the full writeup. Summary:

1. **Fetch** raw data from 6 government sources (fallback to 2023-24 estimates if unavailable)
2. **Normalise** each dimension to 0–100 using clipped min-max (5th/95th percentile)
3. **Impute** missing values using regional median → national median
4. **Weight** and sum subscores into a composite fragility score
5. **Rank** states and assign risk bands (CRITICAL/HIGH/MODERATE/LOW)
6. **Confidence** = fraction of dimensions with real (non-imputed) data

---

## India Map GeoJSON

The `public/india-states.json` file ships with placeholder stub polygons.
Replace it with the real file for an accurate choropleth:

```bash
# Download from datameet/maps (CC0 license)
curl -L https://github.com/datameet/maps/raw/master/States/Admin2.geojson \
  -o public/india-states.json
```

The file must have `properties.ST_NM` matching state display names (e.g. `"Tamil Nadu"`, `"West Bengal"`).

---

## Adding a New Dimension

1. `lib/scorer.ts` — add entry to `SCORER_DIMENSIONS`, add fallback data to `lib/seed.ts`
2. `lib/constants.ts` — add entry to `DIMENSIONS` array
3. `lib/types.ts` — add field to `Subscores` interface

---

## Cite This Project

```bibtex
@misc{senra2026,
  title  = {SENRA — Supply Chain Risk Intelligence},
  author = {Harsh Menon},
  year   = {2026},
  url    = {https://github.com/Harshdemon1/SENRA},
  note   = {Open source under MIT License.}
}
```

---

## License

MIT. Data sources: Government of India (NDSAP), datameet/maps (CC0).

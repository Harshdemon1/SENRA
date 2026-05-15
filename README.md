# India Supply Chain Fragility Index (SCFI)

> The first public, algorithmically-derived ranking of retail supply chain fragility across all 28 Indian states and 8 Union Territories.

**[Live App →](https://scfi.vercel.app)** | **[Methodology →](/methodology)**

---

## What It Does

A decision-support tool for logistics directors, VC analysts, and policy researchers. It computes a **Supply Chain Fragility Score** for every Indian state and UT across 7 dimensions of risk — road infrastructure, distributor density, monsoon disruption, logistics access, power reliability, cold chain infrastructure, and market concentration.

- **Interactive choropleth map** — colour-coded by risk band (CRITICAL / HIGH / MODERATE / LOW)
- **Live weight adjustment** — drag 7 sliders to reweight dimensions for your sector (FMCG, Pharma, Cold Chain, etc.)
- **State drill-down** — full profile with radar chart, trend history, and raw data
- **Compare tool** — side-by-side comparison of up to 4 states
- **AI Analyst** — ask questions about the data, powered by Claude

---

## Architecture

```
Browser
  ├── SWR public reads → FastAPI (port 8000)
  │                           ├── PostgreSQL (Supabase)
  │                           └── Redis cache (Upstash)
  └── POST /api/analyst → Next.js API route (port 3000)
                               └── Anthropic Claude API
```

---

## Quick Start — Zero config, no accounts needed

No Supabase. No Upstash. No API keys. Uses SQLite + in-memory cache by default.

### Windows (one double-click)

```
start.bat
```

### macOS / Linux (one command)

```bash
chmod +x start.sh && ./start.sh
```

That's it. Opens `http://localhost:3000` automatically.

---

### Manual setup (if you prefer)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env — set DATABASE_URL and REDIS_URL (see below)

python seed.py          # Creates tables, computes first scores
uvicorn main:app --reload
```

Test: `curl http://localhost:8000/api/scores` → 36 states sorted by fragility score.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host/db` |
| `REDIS_URL` | Yes | `redis://...` or `rediss://...` |
| `DATA_GOV_IN_API_KEY` | No | data.gov.in API key (free). Without it, fallback data is used. |
| `ANTHROPIC_API_KEY` | No | Only needed for scheduled AI summaries |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: `http://localhost:3000`) |
| `USE_LIVE_DATA` | No | Set to `true` to fetch from real government APIs |
| `ENVIRONMENT` | No | `development` or `production` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g. `https://your-app.onrender.com`) |
| `ANTHROPIC_API_KEY` | No | Server-side only — for the AI analyst chat |

---

## Free Infrastructure Setup

1. **PostgreSQL**: [Supabase free tier](https://supabase.com) → copy connection string as `DATABASE_URL`
2. **Redis**: [Upstash free tier](https://upstash.com) → copy Redis URL as `REDIS_URL`
3. **Backend hosting**: [Render.com](https://render.com) — Root dir: `backend`, Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Frontend hosting**: [Vercel](https://vercel.com) — auto-detects Next.js

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

The `frontend/public/india-states.json` file ships with placeholder stub polygons.  
Replace it with the real file for an accurate choropleth:

```bash
# Download from datameet/maps (CC0 license)
curl -L https://github.com/datameet/maps/raw/master/States/Admin2.geojson \
  -o frontend/public/india-states.json
```

The file must have `properties.ST_NM` matching state display names (e.g. `"Tamil Nadu"`, `"West Bengal"`).

---

## Adding a New Dimension

1. `backend/services/scorer.py` — add entry to `DIMENSIONS`, add fallback data to `fetcher.py`
2. `backend/models.py` — add column to `RawDataSnapshot` and `FragilityScore`
3. `frontend/lib/constants.ts` — add entry to `DIMENSIONS` array and `Subscores` interface in `lib/types.ts`

---

## Cite This Project

```bibtex
@misc{scfi2024,
  title  = {India Supply Chain Fragility Index},
  author = {Harshdemon1},
  year   = {2024},
  url    = {https://github.com/Harshdemon1/Palantir},
  note   = {Open source under MIT License.}
}
```

---

## License

MIT. Data sources: Government of India (NDSAP), datameet/maps (CC0).

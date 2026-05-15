#!/bin/bash
set -e

echo ""
echo " India Supply Chain Fragility Index"
echo " ===================================="
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
cd backend

if [ ! -d ".venv" ]; then
  echo "[1/4] Creating Python virtual environment..."
  python3 -m venv .venv
fi

echo "[2/4] Installing backend dependencies..."
source .venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  echo "[3/4] Creating .env from example..."
  cp .env.example .env
fi

echo "[4/4] Seeding database..."
python seed.py

echo " Starting backend on http://localhost:8000"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# ── Frontend ──────────────────────────────────────────────────────────────────
cd frontend

if [ ! -d "node_modules" ]; then
  echo "[5/5] Installing frontend dependencies..."
  npm install
fi

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
fi

echo " Starting frontend on http://localhost:3000"
echo ""
npm run dev &
FRONTEND_PID=$!

cd ..

echo " Open http://localhost:3000 in your browser."
echo " Press Ctrl+C to stop both servers."
echo ""

wait $BACKEND_PID $FRONTEND_PID

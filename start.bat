@echo off
echo.
echo  India Supply Chain Fragility Index
echo  ====================================
echo.

:: ── Backend ──────────────────────────────────────────────────────────────────
cd backend

if not exist ".venv" (
    echo [1/4] Creating Python virtual environment...
    python -m venv .venv
)

echo [2/4] Installing backend dependencies...
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

if not exist ".env" (
    echo [3/4] Creating .env from example...
    copy .env.example .env
)

echo [4/4] Seeding database and starting backend...
python seed.py
start "SCFI Backend" cmd /k ".venv\Scripts\activate && uvicorn main:app --reload --port 8000"

cd ..

:: ── Frontend ─────────────────────────────────────────────────────────────────
cd frontend

if not exist "node_modules" (
    echo [5/5] Installing frontend dependencies...
    npm install
)

if not exist ".env.local" (
    copy .env.example .env.local
)

echo.
echo  Starting frontend at http://localhost:3000
echo  Backend API at    http://localhost:8000/docs
echo.
start "SCFI Frontend" cmd /k "npm run dev"

cd ..

echo.
echo  Both servers are starting in separate windows.
echo  Open http://localhost:3000 in your browser.
echo.
pause

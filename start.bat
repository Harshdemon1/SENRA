@echo off
echo.
echo  SENRA — Supply Chain Risk Intelligence
echo  ========================================
echo.

if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    npm install
)

echo [2/2] Starting SENRA at http://localhost:3000
echo.
echo  Database will be created automatically on first load.
echo  Press Ctrl+C to stop.
echo.

npm run dev

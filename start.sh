#!/bin/bash
set -e

echo ""
echo " SENRA — Supply Chain Risk Intelligence"
echo " ========================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/2] Installing dependencies..."
  npm install
fi

echo "[2/2] Starting SENRA at http://localhost:3000"
echo ""
echo " Database will be created automatically on first load."
echo " Press Ctrl+C to stop."
echo ""

npm run dev

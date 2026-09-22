#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
PORT="${FRONTEND_PORT:-3000}"

cd "$FRONTEND"

if [ ! -d node_modules ]; then
  echo "==> Installing frontend dependencies"
  npm install
fi

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> Something is already listening on :$PORT - skipping frontend start."
  exit 0
fi

echo "==> Frontend running at http://localhost:$PORT"
exec npm run dev

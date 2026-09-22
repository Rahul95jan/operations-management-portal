#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
VENV="$BACKEND/venv"
PORT="${BACKEND_PORT:-8000}"
HOST="${BACKEND_HOST:-127.0.0.1}"

if [ ! -d "$VENV" ]; then
  echo "==> Creating virtualenv at backend/venv"
  python3 -m venv "$VENV"
fi

echo "==> Syncing backend dependencies"
"$VENV/bin/python" -m pip install --quiet --upgrade pip
"$VENV/bin/python" -m pip install --quiet -r "$BACKEND/requirements.txt"

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> Something is already listening on :$PORT - skipping backend start."
  exit 0
fi

echo "==> Backend running at http://$HOST:$PORT"
cd "$BACKEND"
exec "$VENV/bin/uvicorn" main:app --reload --host "$HOST" --port "$PORT"

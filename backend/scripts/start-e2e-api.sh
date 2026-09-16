#!/usr/bin/env bash
# Boots the TelemetryAPI backend for end-to-end tests: creates the venv if
# needed, applies the schema, reseeds a fresh SQLite database, and serves the
# API on 127.0.0.1:8001 (a non-default port so local dev setups on 8000 are
# never disturbed).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .venv ]; then
  python3.11 -m venv .venv
fi

if ! .venv/bin/python -c "import fastapi, uvicorn" 2>/dev/null; then
  .venv/bin/pip install -q -e ".[dev]"
fi

rm -f telemetry.db
.venv/bin/python -m app.migrate
.venv/bin/python -m app.seed

exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

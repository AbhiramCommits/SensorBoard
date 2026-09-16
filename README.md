# SensorBoard

[![CI](https://github.com/AbhiramCommits/SensorBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhiramCommits/SensorBoard/actions/workflows/ci.yml)

SensorBoard is a full-stack telemetry dashboard: a React 18 + TypeScript single-page app (built with Vite) that visualizes sensor readings served by a FastAPI backend, **TelemetryAPI**. It supports server-side search, filtering, date ranges, and pagination over a PostgreSQL database (SQLite for local dev), with a sensor list view and a per-sensor detail view featuring a live line chart. The UI contract is captured as ASCII wire-frames in `docs/wireframe.md`, the API contract as an OpenAPI 3.1 spec in `openapi/telemetry.yaml` (with a CI check that fails on drift), and both are enforced by an automated test pyramid: 35 Vitest unit/component tests, 26 pytest backend tests, and 16 Playwright end-to-end tests including axe accessibility scans — all orchestrated by GitHub Actions, with production images published to GHCR.

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        SPA[React 18 + TypeScript SPA<br/>Vite build, served by nginx:alpine]
    end
    subgraph Backend
        API[FastAPI TelemetryAPI<br/>SQLAlchemy 2.0 / Pydantic v2]
        DB[(PostgreSQL 16<br/>SQLite for local dev)]
    end
    subgraph Automation
        PW[Playwright e2e<br/>Chromium + Mobile Chrome]
        CI[GitHub Actions<br/>lint / test / e2e / docker]
        GHCR[(ghcr.io images)]
    end
    SPA -->|HTTP JSON| API
    API -->|SQL| DB
    PW -->|drives + boots| SPA
    PW -->|seeds + probes| API
    CI -->|runs| PW
    CI -->|builds + pushes| GHCR
    SPA -.deployed from.-> GHCR
    API -.deployed from.-> GHCR
```

## Quickstart

### Everything at once

```sh
docker compose up
```

Boots PostgreSQL 16, the seeded API (`http://localhost:8000`, docs at `/docs`), and the Vite dev server (`http://localhost:5173`). The API container applies the schema and seeds 40 sensors / 30 days of readings on first start.

### Frontend only

```sh
npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:8000
npm run dev             # http://localhost:5173
```

### Backend only

```sh
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m app.seed                       # schema + demo data (SQLite by default)
.venv/bin/python -m uvicorn app.main:app --reload  # http://localhost:8000
```

Set `DATABASE_URL` to a PostgreSQL connection string to use PostgreSQL instead of SQLite.

## API reference

Generated from `openapi/telemetry.yaml` (the FastAPI app implements it exactly — CI fails on drift):

| Method | Path                         | Parameters                                                                                                                                                                                                                                                      | Response                                                                                                                             |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/sensors`               | `q` (text search over name/location), `type` (`temperature` \| `humidity` \| `pressure` \| `vibration`), `status` (`online` \| `offline` \| `degraded`), `start`, `end` (ISO 8601, filters `updated_at`), `page` (default 1), `page_size` (default 20, max 100) | `{ items: Sensor[], total, page, page_size }`                                                                                        |
| GET    | `/api/sensors/{id}`          | path `id`                                                                                                                                                                                                                                                       | `Sensor { id, name, type, status, location, unit, last_reading: number\|null, updated_at }`                                          |
| GET    | `/api/sensors/{id}/readings` | path `id`, `start`, `end` (ISO 8601, inclusive), `limit` (default 100, max 1000)                                                                                                                                                                                | `{ items: Reading[], total }` — `Reading { sensor_id, value, recorded_at }`, newest first                                            |
| POST   | `/api/readings/bulk`         | body `{ readings: ReadingInput[] }`                                                                                                                                                                                                                             | `{ accepted, rejected, errors: { index, message }[] }` — valid rows are committed in one transaction; rejects are reported per index |
| GET    | `/healthz`                   | —                                                                                                                                                                                                                                                               | `{ status: "ok" }`                                                                                                                   |

## Wire-frame to interface

The wire-frames in `docs/wireframe.md` are the build contract; the screenshots in `docs/screenshots/` are regenerated from the running app with `npm run screenshots`.

### Sensor list

<table>
<tr>
<td width="50%">
<pre>
+==================================+
| SensorBoard               [logo] |
+==================================+
| [ Search.... ] Type[v] Status[v] |
| From [date]  To [date]  [Reset] |
+----------------------------------+
| Name    | Type | Status | Last.. |
|---------|------|--------|-------|
| Hallway | temp | online | 21.4°C|
| ...                                |
+----------------------------------+
| Showing 1-25 of 40  [10/25/50 v] |
| < Prev  1 2  Next >  Page 1 of 2 |
+==================================+
</pre>
</td>
<td>
<img src="docs/screenshots/list.png" alt="Shipped sensor list view" width="100%">
</td>
</tr>
</table>

### Sensor detail

<table>
<tr>
<td width="50%">
<pre>
+==================================+
| SensorBoard               [logo] |
+==================================+
| Sensors > Hallway-01             |
+----------------------------------+
| Metadata     | Readings over     |
| ID, Type,    | date range        |
| Location,    |     ___/\___      |
| Unit, Status | __/        \__    |
+----------------------------------+
| Recent readings                  |
| Recorded At        | Value       |
|--------------------|-------------|
| 2026-02-01 09:41Z  | 21.4 °C     |
+==================================+
</pre>
</td>
<td>
<img src="docs/screenshots/detail.png" alt="Shipped sensor detail view" width="100%">
</td>
</tr>
</table>

The same layouts adapt below 768px — tables become stacked cards:

<img src="docs/screenshots/mobile.png" alt="Mobile layout with stacked card table" width="320">

Shared states (loading skeletons, error banner with Retry, empty states) are also wire-frame-driven; the error banner from a forced API failure:

<img src="docs/screenshots/error.png" alt="Error banner with Retry button" width="480">

## Testing

| Layer                                                                                               | Command                                    | Result from the latest local run                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Unit + component (Vitest + React Testing Library + MSW)                                             | `npm test`                                 | **35/35 tests passed**                                                                     |
| Coverage (v8, threshold enforced in CI)                                                             | `npm run test:coverage`                    | **84.61% statements**                                                                      |
| End-to-end (Playwright, Chromium + Mobile Chrome, against a freshly seeded FastAPI + preview build) | `npm run test:e2e`                         | **16 tests: 15 passed, 1 skipped** (the keyboard-traversal spec is desktop-only by design) |
| Backend (pytest, SQLite locally / PostgreSQL 16 in CI)                                              | `cd backend && .venv/bin/python -m pytest` | **26/26 tests passed**                                                                     |
| API latency (200 requests, seeded 40 sensors / 113,704 readings)                                    | —                                          | **p50 = 0.8 ms, p95 = 1.2 ms** on `GET /api/sensors`                                       |

Run `npx playwright install chromium` once before the first e2e run. `npm run screenshots` regenerates `docs/screenshots/` from a fresh seeded stack.

## Accessibility

Both pages are scanned on every e2e run with `@axe-core/playwright` in Chromium **and** Mobile Chrome. Latest run: **0 serious/critical violations** on the sensor list and detail pages. The e2e suite also covers keyboard-only navigation (tabbing to filters, activating a table row with Enter) and the UI implements labelled form controls, `aria-live` result counts, scoped table headers, visible focus rings, and semantic landmarks throughout.

## Deployment

CI publishes two production images to GHCR on every push to `main` (tagged `sha` + `latest`):

- `ghcr.io/<owner>/sensorboard-web` — nginx:alpine, non-root, port `8080`, SPA fallback, gzip, immutable caching for hashed assets. **103 MB.**
- `ghcr.io/<owner>/sensorboard-api` — python:3.11-slim, non-root, port `8000`, `HEALTHCHECK` on `/healthz`. **295 MB.**

Any container runtime works:

| Runtime              | Setup                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| IBM Code Engine      | Create an app from each GHCR image; expose port `8000` (API) / `8080` (web); set `DATABASE_URL` on the API app.                       |
| AWS ECS              | Two Fargate tasks (or one service per image); ALB health checks `/healthz` and `/`; `DATABASE_URL` as an API task environment secret. |
| Azure Container Apps | Two container apps with ingress on `8000`/`8080`; `DATABASE_URL` as an API app secret.                                                |

Required environment variables:

- **API**: `DATABASE_URL` — PostgreSQL connection string, e.g. `postgresql+psycopg://user:pass@host:5432/db` (falls back to SQLite when unset, for local dev only).
- **Web**: none at runtime — the API base URL is baked in at build time:

```sh
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t sensorboard-web .
```

The API runs `python -m app.migrate && python -m app.seed` at startup, so a fresh deployment self-provisions its schema and demo data. For new frontend origins, extend the CORS allowlist in `backend/app/main.py`.

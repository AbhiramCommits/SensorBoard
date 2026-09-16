# Resume bullets

Measured, not estimated — every number below comes from a local run of the
project's own tooling (see `README.md` § Testing).

- **React 18 + TypeScript (Vite) with Vitest + React Testing Library** — 84.61% statement coverage, 35/35 passing unit/component tests, all API interactions mocked with MSW handlers generated from the OpenAPI spec.

- **Playwright automation** — 16 end-to-end tests across Chromium and Mobile Chrome (15 passed, 1 desktop-only skip), driving a real seeded FastAPI + preview stack; includes axe accessibility scans with **0 serious/critical violations** and a keyboard-only navigation spec.

- **FastAPI + SQLAlchemy 2.0 telemetry backend** — serves 40 sensors with 113,704 seeded readings; **p50 = 0.8 ms / p95 = 1.2 ms** on `GET /api/sensors` (200 requests); 26/26 pytest cases green on both SQLite and PostgreSQL 16.

- **Production containers + GitHub Actions pipeline** — multi-stage nginx web image (**103 MB**) and Python 3.11 API image (**295 MB**, non-root, health-checked), built with Buildx layer caching and published to GHCR with SHA + `latest` tags; CI gates everything on lint, typechecks, coverage thresholds, pytest, and e2e.

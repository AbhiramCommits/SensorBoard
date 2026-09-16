# SensorBoard

Front end for TelemetryAPI, a FastAPI service that tracks sensor telemetry.

## Stack

- React 18 + TypeScript
- Vite
- ESLint + Prettier

## Getting started

```sh
npm install
cp .env.example .env
npm run dev
```

Point `VITE_API_BASE_URL` at a running TelemetryAPI instance (defaults to
`http://localhost:8000`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and production build
- `npm run lint` — run ESLint
- `npm run gen:api` — regenerate `src/api/schema.d.ts` from `openapi/telemetry.yaml`

## API client

`src/api/client.ts` exposes one typed function per TelemetryAPI endpoint. Types
are generated from `openapi/telemetry.yaml`; edit the spec, then run
`npm run gen:api`.

## UI

Wireframes in `docs/wireframe.md` are the build contract for the UI.

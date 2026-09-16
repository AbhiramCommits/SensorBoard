# Contributing to SensorBoard

Thanks for contributing. The team works in short Agile sprints; everything below
is designed to keep the trunk shippable at all times.

## Branches

Work off `main`, which is always deployable. Branch names follow
`<type>/<ticket>-<short-description>`:

- `feat/STORY-123-add-sensor-export` — new functionality
- `fix/BUG-456-status-filter-crash` — bug fixes
- `chore/DEV-789-update-deps` — tooling, CI, dependency bumps
- `docs/README-cleanup` — documentation only

## Workflow

1. Pick a story/bug from the sprint backlog and assign it to yourself.
2. Create a branch from `main` using the naming convention above.
3. Keep changes small: one story or bug per PR. If a change grows beyond a few
   hundred lines, split it.
4. Open a **draft PR** as soon as you have something to share, linking the
   ticket. Mention `@team` in the daily standup when it is ready for review.
5. Keep `main` green: rebase on `main` before review and resolve conflicts.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new capability
- `fix:` bug fix
- `test:` tests only
- `refactor:` behavior-neutral changes
- `chore:` tooling, config, dependencies
- `docs:` documentation

Commits are squashed onto `main` by the PR merge, so the branch history is
free-form; keep the PR title and body conventional.

## Pull requests

Every PR must:

- Reference its ticket in the description.
- Pass all CI checks: lint, typechecks, frontend tests with coverage, backend
  tests against PostgreSQL, end-to-end tests, and the OpenAPI drift check.
- Get at least one approving review from someone other than the author.
- Use the pull request template, including a test plan.
- Not merge with unresolved review threads.

Merges are **squash** merges to `main`. `main` builds are published as Docker
images (`sha` + `latest`) to GHCR via the CI `docker` job.

## Definition of done

A story is done when:

- Behavior matches `docs/wireframe.md` (the UI build contract) and the OpenAPI
  spec in `openapi/telemetry.yaml`.
- New behavior is covered by unit/component tests and, where it touches user
  flows, an end-to-end test.
- Coverage stays at or above the 70% statement threshold.
- The story was demoed in sprint review and accepted by the product owner.

## Ceremonies

- **Sprint planning** — refine and commit to a sprint backlog (1–2 weeks).
- **Daily standup** — what did I do, what will I do, blockers.
- **Sprint review** — demo done stories against the definition of done.
- **Retrospective** — what went well, what to improve, actions.

## Local development

See the [README](README.md) for setup. The quick list:

```sh
npm install
npm run dev                       # frontend on :5173

cd backend
python3.11 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -m app.seed      # schema + demo data
.venv/bin/python -m uvicorn app.main:app --reload
```

Verify before pushing:

```sh
npm run lint && npm run format:check && npm run build
npm run test:coverage
cd backend && .venv/bin/python -m pytest
npm run test:e2e                   # needs `npx playwright install chromium`
```

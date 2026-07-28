# weather-demo

An accessible, spec-driven weather forecast portfolio demo: React + Node.js + PostgreSQL, built
feature-by-feature under [GitHub spec-kit](https://github.com/github/spec-kit) with a
[WCAG 2.2 AA accessibility contract](.github/skills/building-accessible-ui/SKILL.md) required in
every UI spec before implementation starts. See [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
for the project's governing principles.

## Quickstart

```sh
cp .env.example .env
docker compose up --build
```

That builds and starts Postgres, then runs a one-shot `migrate` service that applies schema
migrations, creates the least-privilege database roles, and seeds a starter set of cities. Once
`migrate` exits `0`, two long-running services start: `ingest` (fetches every seeded city's current
conditions and forecast from Open-Meteo immediately, then hourly) and `api` (serves that data
read-only at `http://localhost:3000`). `web` is added in `003-forecast-browser`.

Try it:

```sh
curl http://localhost:3000/api/cities
curl http://localhost:3000/api/cities/tokyo-jp
curl 'http://localhost:3000/api/cities/tokyo-jp/forecast?range=hourly'
curl http://localhost:3000/api/meta/freshness
```

Browse the API docs at `http://localhost:3000/api/docs`, or inspect the database directly:

```sh
docker exec -it weather-demo-postgres-1 psql -U weather_owner -d weather_demo -c '\dt'
docker exec -it weather-demo-postgres-1 psql -U weather_owner -d weather_demo -c 'select name, slug from cities;'
```

## Workspace layout

npm workspaces monorepo; every package under `packages/` has its own `package.json` and
`tsconfig.json` (extending the shared [`tsconfig.base.json`](tsconfig.base.json)) and is picked up
automatically by the root `lint` / `typecheck` / `test` scripts — no per-package wiring needed.

| Package           | Purpose                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `packages/db`     | Drizzle ORM schema, checked-in SQL migrations, least-privilege role setup, seed data, repositories |
| `packages/api`    | Fastify REST API (read-only `GET` routes only, OpenAPI docs at `/api/docs`)                        |
| `packages/ingest` | Scheduled worker that pulls weather data from Open-Meteo (on boot, then hourly)                    |
| `packages/ui`     | Accessible component library (React Aria Components + Tailwind) — added in `003-forecast-browser`  |
| `packages/web`    | The Vite/React SPA — added in `003-forecast-browser`                                               |

Adding a new package: create `packages/<name>/package.json` (with a `typecheck` script) and
`tsconfig.json` extending `../../tsconfig.base.json`; `npm install` at the root links it, no
further configuration required.

## Local development

```sh
npm install
npm run lint          # ESLint, includes a 600-line-per-file ceiling enforced as an error
npm run typecheck      # tsc --noEmit across every workspace package
npm test               # Vitest — unit tests, plus packages/db integration tests against Postgres
npm run test:e2e        # Playwright (added in later features)
```

`packages/db`'s tests are integration tests against a real Postgres instance. Point them at any
throwaway database, for example the one `docker compose` already starts:

```sh
docker compose up -d postgres
export DATABASE_URL_OWNER=postgresql://weather_owner:<POSTGRES_PASSWORD from .env>@localhost:55432/weather_demo
export TEST_DATABASE_URL=$DATABASE_URL_OWNER
npm test
```

## Database

- Schema is normalized (3NF) and lives in `packages/db/src/schema/`; every change ships as a
  generated, checked-in migration (`npm run db:generate`, never `drizzle-kit push`).
- Three Postgres roles enforce that **the public surface is read-only**: `weather_owner` (runs
  migrations, owns all objects), `weather_ingest` (`SELECT`, plus `INSERT`/`UPDATE` only on the
  tables the ingestion job populates), `weather_api` (`SELECT` only, on every table present and
  future). See [`packages/db/roles.sql`](packages/db/roles.sql) and
  [`packages/db/src/apply-roles.ts`](packages/db/src/apply-roles.ts).
- Weather data is never written by user request — only by the scheduled ingestion worker
  (`packages/ingest`).

## API

Every route is `GET`; an automated test (`packages/api/src/app.test.ts`) fails the build if any
route ever accepts `POST`/`PUT`/`PATCH`/`DELETE`.

| Route                                                | Description                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /api/health`                                    | Liveness check                                                                                         |
| `GET /api/cities`                                    | Every seeded city, with its region                                                                     |
| `GET /api/cities/:slug`                              | City detail, latest observation, and when it was last refreshed                                        |
| `GET /api/cities/:slug/forecast?range=hourly\|daily` | Forecast rows for that city                                                                            |
| `GET /api/meta/freshness`                            | Provider name and the most recent successful ingest run                                                |
| `GET /api/docs` / `GET /api/openapi.json`            | Browsable / machine-readable API docs, generated from the same zod schemas that validate every request |

## Ingestion

`packages/ingest` fetches current conditions plus 7 days of hourly and daily forecast from
[Open-Meteo](https://open-meteo.com/) for every city in `cities`, immediately on start and then
hourly. Each run writes one `ingest_runs` row; a single city's failure (network error or a response
that fails schema validation) is recorded and skipped without stopping the rest of the cycle or
crashing the worker. Re-ingesting the same city upserts on each table's unique (city, valid-time)
constraint, so re-running never duplicates rows.

## Accessibility

Every user-facing feature's spec includes a full accessibility contract (components, accessible
names, keyboard/focus behavior, live regions, testing strategy, known limitations) before
implementation begins — see
[`references/spec-driven-development.md`](.github/skills/building-accessible-ui/references/spec-driven-development.md).
No feature in this project claims to be "fully accessible"; known limitations are recorded in each
feature's spec.

## Specs

Each feature is planned under `specs/NNN-<slug>/` (`spec.md` → `plan.md` → `tasks.md`) via
spec-kit:

- [`specs/001-platform-foundation-npm`](specs/001-platform-foundation-npm/spec.md) — monorepo,
  schema, roles, Docker, base CI
- [`specs/002-weather-ingestion-worker`](specs/002-weather-ingestion-worker/spec.md) — ingestion
  worker and read-only API

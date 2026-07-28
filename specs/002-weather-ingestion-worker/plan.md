# Implementation Plan: Weather Ingestion Worker & Read-Only API

**Branch**: `002-weather-ingestion-worker` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-weather-ingestion-worker/spec.md`

## Summary

Add a scheduled ingestion worker (`packages/ingest`) that fetches current conditions and forecasts
from Open-Meteo for every seeded city and upserts them into the schema from
`001-platform-foundation-npm`, and a read-only Fastify API (`packages/api`) that serves that data
over `GET`-only JSON routes with a generated OpenAPI document. Both processes share a new typed
repository layer added to `packages/db` so neither composes SQL directly (spec FR-013).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS (continues `001`)

**Primary Dependencies**: `undici`/native `fetch` + `zod` (Open-Meteo client validation), `fastify`
5.x, `fastify-type-provider-zod`, `@fastify/swagger` + `@fastify/swagger-ui`, `@fastify/cors`

**Storage**: PostgreSQL 16 via the `packages/db` repository layer (new in this feature)

**Testing**: Vitest — worker tests use recorded Open-Meteo fixtures with `fetch` mocked (no network
in CI, per spec Assumptions); API tests use Fastify's `app.inject()` against the `postgres:16` CI
service seeded with test data

**Target Platform**: Linux containers (Docker), GitHub Actions runners — unchanged from `001`

**Project Type**: Web application monorepo (continues `001`'s workspace layout)

**Performance Goals**: Not a target for a portfolio demo at this scale (a dozen cities, hourly
ingestion); no specific latency budget

**Constraints**: API process holds only `weather_api` (`SELECT`-only) credentials; worker process
holds only `weather_ingest` credentials; API exposes no non-`GET` route (enforced by an automated
test, spec FR-007/SC-003)

**Scale/Scope**: ~12 seeded cities, hourly ingestion, five new read routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Accessibility | No UI in this feature — `## Accessibility` in spec explicitly states not applicable, per the template's own opt-out | N/A, documented |
| II. Test-first, every layer | Worker tests use fixtures (no live network dependency in CI); API tests via `app.inject()` against a seeded test database; both added alongside their implementation tasks | PASS |
| III. Public surface read-only | API connects only as `weather_api`; automated test asserts the Fastify route table has zero non-`GET` routes | PASS |
| IV. Normalized, migration-driven schema | No schema changes in this feature — reads/writes existing `001` tables through the new repository layer only | PASS |
| V. Small, single-concern files | Worker and API each split into single-purpose files (client, mapper, cycle, scheduler / routes, schemas, openapi, server) — see Source Code layout below | PASS |
| VI. Conventional Commits | No change | PASS |

No violations — Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-weather-ingestion-worker/
├── plan.md
├── tasks.md
└── spec.md
```

### Source Code (repository root)

```text
packages/
├── db/src/
│   └── repositories/                 # NEW — typed queries shared by ingest + api (spec FR-013)
│       ├── cities.ts                 # getCities, getCityBySlug
│       ├── observations.ts           # getLatestObservation, upsertObservation
│       ├── forecasts.ts              # getForecastHourly/Daily, upsertForecastHourly/Daily (bulk)
│       └── ingest-runs.ts            # createIngestRun, completeIngestRun, getLatestSuccessfulRun
│
├── ingest/src/
│   ├── open-meteo-schema.ts          # zod schema for the Open-Meteo forecast response
│   ├── open-meteo-client.ts          # fetch + validate one city's forecast
│   ├── mapper.ts                     # Open-Meteo response -> observation/forecast row shapes
│   ├── cycle.ts                      # one ingestion cycle: per-city fetch/map/upsert, tracks failures
│   ├── scheduler.ts                  # run-on-boot + hourly tick, overlap guard (spec FR-006)
│   └── index.ts                      # entry point: db client (weather_ingest role) + scheduler
│
└── api/src/
    ├── schemas.ts                    # zod request/response schemas (source of the OpenAPI doc too)
    ├── errors.ts                     # shared JSON error shape + not-found/bad-request helpers
    ├── routes/
    │   ├── health.ts                 # GET /api/health
    │   ├── cities.ts                 # GET /api/cities, /api/cities/:slug, /api/cities/:slug/forecast
    │   └── meta.ts                   # GET /api/meta/freshness
    ├── openapi.ts                    # @fastify/swagger + swagger-ui registration (serves /api/docs)
    ├── app.ts                        # builds the Fastify instance + registers plugins/routes
    └── server.ts                     # entry point: db client (weather_api role) + app.listen
```

**Structure Decision**: Extends `001`'s five-package layout; no new packages. The repository layer
lives in `packages/db` (not duplicated in `ingest`/`api`) so both processes query through the same
typed functions and neither ever builds SQL from external input.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

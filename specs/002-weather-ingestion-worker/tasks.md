---
description: "Task list for 002-weather-ingestion-worker"
---

# Tasks: Weather Ingestion Worker & Read-Only API

**Input**: Design documents from `/specs/002-weather-ingestion-worker/`
**Prerequisites**: plan.md, spec.md, `001-platform-foundation-npm` implemented

**Tests**: Included — constitution Principle II.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 [P] Add `fastify`, `fastify-type-provider-zod`, `@fastify/swagger`,
      `@fastify/swagger-ui`, `@fastify/cors`, `zod` to `packages/api/package.json`
- [x] T002 [P] Add `zod` to `packages/ingest/package.json` (native `fetch` — no HTTP client dep needed)

## Phase 2: Foundational — shared repository layer (Blocking Prerequisites)

**Purpose**: Typed query functions both `ingest` and `api` use, so neither composes SQL (FR-013).

- [x] T003 [US1,US2] Create `packages/db/src/repositories/cities.ts`: `getCities(db)` (joined with
      region), `getCityBySlug(db, slug)`
      Test: `packages/db/src/repositories/cities.test.ts`
- [x] T004 [US2] Create `packages/db/src/repositories/observations.ts`: `getLatestObservation(db,
      cityId)`, `upsertObservation(db, row)` (upsert on the (city, observed_at) unique constraint)
      Test: `packages/db/src/repositories/observations.test.ts`
- [x] T005 [US2] Create `packages/db/src/repositories/forecasts.ts`: `getForecastHourly(db,
      cityId)`, `getForecastDaily(db, cityId)`, `upsertForecastHourly(db, rows)`,
      `upsertForecastDaily(db, rows)` (bulk upsert on each table's unique constraint)
      Test: `packages/db/src/repositories/forecasts.test.ts`
- [x] T006 [US1,US3] Create `packages/db/src/repositories/ingest-runs.ts`: `createIngestRun(db,
      providerId)`, `completeIngestRun(db, id, {status, error})`,
      `getLatestSuccessfulIngestRun(db)`
      Test: `packages/db/src/repositories/ingest-runs.test.ts`

**Checkpoint**: Repository layer independently tested against Postgres; ingest and api can now be
built in parallel.

---

## Phase 3: User Story 1 - Weather data refreshes itself with no manual step (Priority: P1) 🎯 MVP

### Tests for User Story 1

- [x] T007 [P] [US1] Record 2-3 realistic Open-Meteo fixture responses (current + hourly + daily)
      as JSON under `packages/ingest/src/__fixtures__/open-meteo-response.json`

### Implementation for User Story 1

- [x] T008 [US1] `packages/ingest/src/open-meteo-schema.ts`: zod schema for the Open-Meteo
      `/v1/forecast` response (current/hourly/daily blocks)
      Test: `packages/ingest/src/open-meteo-schema.test.ts` — parses the T007 fixture; rejects a
      malformed fixture (spec edge case: invalid shape treated as failure)
- [x] T009 [US1] `packages/ingest/src/open-meteo-client.ts`: `fetchForecast(city)` — builds the
      request URL, fetches, validates with T008's schema, throws a typed error on failure
      Test: `packages/ingest/src/open-meteo-client.test.ts` (mocked `fetch`, using T007 fixtures;
      one case asserts a network/shape failure throws rather than writing partial data)
- [x] T010 [US1] `packages/ingest/src/mapper.ts`: maps a validated Open-Meteo response + city +
      ingest run id into `observations`/`forecast_hourly`/`forecast_daily` row shapes, resolving
      weather codes via the existing `weather_codes` lookup
      Test: `packages/ingest/src/mapper.test.ts`
- [x] T011 [US1] `packages/ingest/src/cycle.ts`: `runCycle(deps)` — creates an `ingest_runs` row
      (T006), iterates all cities (T003), fetches+maps+upserts each (T009/T010, T004/T005),
      catches and records a per-city failure without aborting the cycle (FR-005), completes the
      run (T006)
      Done when: one city's mocked fetch failure does not prevent other cities' rows from being
      written (SC-004)
      Test: `packages/ingest/src/cycle.test.ts` (integration, seeded test db + mocked fetch)
- [x] T012 [US1] `packages/ingest/src/scheduler.ts`: runs `runCycle` immediately on start, then
      every hour; guards against overlapping runs (FR-006)
      Test: `packages/ingest/src/scheduler.test.ts` (fake timers; asserts a slow in-flight cycle
      blocks a concurrent tick)
- [x] T013 [US1] `packages/ingest/src/index.ts`: entry point — builds a `weather_ingest`-role db
      client from `DATABASE_URL_INGEST`, starts the scheduler
- [x] T014 [US1] `docker/Dockerfile.ingest` (multi-stage, non-root, mirrors `Dockerfile.migrate`'s
      pattern) + wire an `ingest` service into `docker-compose.yml`, `depends_on: migrate:
      condition: service_completed_successfully`

**Checkpoint**: User Story 1 fully functional — `docker compose up` results in ingested data for
every seeded city within one cycle (SC-001), re-runs upsert (SC-002).

---

## Phase 4: User Story 2 - A consumer can read current weather over HTTP (Priority: P1)

### Implementation for User Story 2

- [x] T015 [US2] `packages/api/src/errors.ts`: shared JSON error shape + `notFound()` /
      `badRequest()` helpers
- [x] T016 [US2] `packages/api/src/schemas.ts`: zod request/response schemas for every route
      (city, forecast row, error shape, `range` query param enum)
- [x] T017 [US2] `packages/api/src/routes/health.ts`: `GET /api/health`
      Test: `packages/api/src/routes/health.test.ts`
- [x] T018 [US2] `packages/api/src/routes/cities.ts`: `GET /api/cities`, `GET /api/cities/:slug`,
      `GET /api/cities/:slug/forecast?range=hourly|daily` using T003–T005's repositories; unknown
      slug → 404 (FR-011); invalid `range` → 400 (FR-010)
      Test: `packages/api/src/routes/cities.test.ts` (`app.inject()` against seeded test db;
      covers 200/404/400 cases from spec Acceptance Scenarios)
- [x] T019 [US2] `packages/api/src/app.ts`: builds the Fastify instance with the zod type
      provider, registers `@fastify/cors`, error handler, and all routes
      Done when: an automated test enumerates the built app's routes and asserts every one is
      `GET` (FR-007/SC-003)
      Test: `packages/api/src/app.test.ts`
- [x] T020 [US2] `packages/api/src/server.ts`: entry point — builds a `weather_api`-role db client
      from `DATABASE_URL_API`, starts `app.listen`
- [x] T021 [US2] `docker/Dockerfile.api` + wire an `api` service into `docker-compose.yml`,
      publishing its port, `depends_on: migrate: condition: service_completed_successfully`

**Checkpoint**: User Stories 1 and 2 both work independently; `curl localhost:<api-port>/api/cities`
returns real seeded/ingested data end to end through Docker.

---

## Phase 5: User Story 3 - A visitor can tell how fresh the data is (Priority: P2)

### Implementation for User Story 3

- [x] T022 [US3] `packages/api/src/routes/meta.ts`: `GET /api/meta/freshness` using T006's
      `getLatestSuccessfulIngestRun`
      Test: `packages/api/src/routes/meta.test.ts`
- [x] T023 [US3] Include the source `ingest_runs` timestamp in `GET /api/cities/:slug`'s response
      (extends T018)
      Done when: the field is present and matches the `ingest_runs` row the observation came from
      Test: extends `packages/api/src/routes/cities.test.ts`

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T024 [US2] `packages/api/src/openapi.ts`: register `@fastify/swagger` +
      `@fastify/swagger-ui` generating the doc from T016's zod schemas; serve `/api/openapi.json`
      and `/api/docs`
      Done when: `GET /api/openapi.json` parses as valid OpenAPI (SC-005)
      Test: `packages/api/src/openapi.test.ts`
- [x] T025 Update root `README.md`: document the ingestion schedule, the new API routes, and
      `docker compose up` now also starting `ingest` + `api`
- [x] T026 Extend `.github/workflows/ci.yml`: after the existing migrate/roles/seed steps, also
      run the `ingest`/`api` unit + integration test suites (already covered by `npm test` if
      `vitest.config.ts` picks up the new packages — verify and adjust the CI step name/comment
      only if needed)
- [x] T027 Run `npm run lint`, `npm run typecheck`, `npm test` at the root and fix any violation
      before considering this feature complete (constitution Principle II re-run rule)

---

## Dependencies & Execution Order

- Setup (T001–T002) has no dependencies.
- Foundational (T003–T006) depends on Setup; blocks all user stories.
- US1 (T007–T014) depends on Foundational.
- US2 (T015–T021) depends on Foundational; can proceed in parallel with US1 (different packages),
  though T018/T023's tests are more meaningful once US1 has produced real data.
- US3 (T022–T023) depends on US2 (extends its routes) and Foundational's T006.
- Polish (T024–T027) depends on US1, US2, and US3.

## Notes

- No `[Story]` accessibility Done-when/Test lines appear above — this feature renders no UI (spec
  `## Accessibility` states not applicable, per the template's own opt-out).
- Every implementation task carries a `Test:` or `Done when:` line per the tasks template's
  Testing rule (constitution Principle II).

## Addendum (spec FR-014, added while planning 003-accessible-forecast-browser)

- [x] T028 Join `weather_codes` in `getLatestObservation`, `getForecastHourly`, `getForecastDaily`
      (`packages/db/src/repositories/{observations,forecasts}.ts`) to return `weatherLabel` /
      `weatherIconKey`; propagate through `packages/api/src/{schemas,serializers}.ts`
      Done when: `GET /api/cities/:slug` includes `weatherLabel` (e.g. "Mainly clear"), not just
      the bare WMO code
      Test: extends `packages/api/src/routes/cities.test.ts`

# Feature Specification: Weather Ingestion Worker & Read-Only API

**Feature Branch**: `002-weather-ingestion-worker`

**Created**: 2026-07-27

**Status**: Implemented

**Input**: User description: "weather ingestion worker and read-only REST API: pull current
conditions and forecasts from Open-Meteo on a schedule, expose cities and forecasts via GET-only
Fastify routes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Weather data refreshes itself with no manual step (Priority: P1)

Once the platform foundation (`001-platform-foundation-npm`) is running, an operator expects
weather data to appear and stay current without ever running a script by hand: a worker fetches
current conditions and forecasts for every seeded city on a schedule and writes them into the
normalized schema, tagged with the ingest run that produced them.

**Why this priority**: Nothing else in the product (the API, the eventual UI) has anything to show
without this. It is the reason the platform foundation exists.

**Independent Test**: Start the worker against the seeded database; within one scheduled cycle,
query `observations` and `forecast_hourly`/`forecast_daily` for a seeded city and find rows whose
`ingest_run_id` points to a `succeeded` `ingest_runs` row created in this run.

**Acceptance Scenarios**:

1. **Given** the worker starts against a freshly migrated, seeded database, **When** it runs its
   first cycle (immediately on boot, not waiting for the first scheduled tick), **Then** every
   seeded city has at least one observation row and forecast rows for both hourly and daily ranges.
2. **Given** a city already has observation/forecast rows from a previous run, **When** the worker
   runs again for overlapping valid times, **Then** existing rows are updated in place (upserted on
   their unique constraint), not duplicated.
3. **Given** Open-Meteo is unreachable or returns an error for one city, **When** the worker's
   cycle runs, **Then** that city's failure is recorded, other cities in the same cycle still
   complete successfully, and the worker does not crash.
4. **Given** the worker's database credentials are the `weather_ingest` role, **When** it attempts
   anything outside its granted tables (per `001-platform-foundation-npm`'s roles.sql), **Then**
   Postgres denies it — the worker's own code has no special path that needs broader access.

---

### User Story 2 - A consumer can read current weather over HTTP (Priority: P1)

A client (eventually the web UI, but also directly testable via `curl`) requests the list of
cities and, for one city, its current conditions and forecast, over plain `GET` HTTP requests
returning JSON.

**Why this priority**: This is the read path the entire product is for; without it the ingested
data is invisible to anything outside the database.

**Independent Test**: With the worker having completed at least one cycle, `curl` each route below
and confirm the documented shape and status codes, with no authentication required (public,
read-only).

**Acceptance Scenarios**:

1. **Given** the database is seeded, **When** a client requests `GET /api/cities`, **Then** the
   response is `200` with every seeded city's slug, name, region, timezone, and coordinates.
2. **Given** a valid city slug, **When** a client requests `GET /api/cities/:slug`, **Then** the
   response is `200` with the city's detail and its most recent observation (or a clearly-shaped
   "no data yet" body if the worker has not completed a first cycle for it).
3. **Given** a valid city slug, **When** a client requests
   `GET /api/cities/:slug/forecast?range=hourly` or `?range=daily`, **Then** the response is `200`
   with the corresponding forecast rows for that city, ordered by valid time ascending.
4. **Given** an unknown city slug, **When** a client requests any `/api/cities/:slug*` route,
   **Then** the response is `404` with a JSON error body, not a stack trace or HTML page.
5. **Given** any client, **When** they request any URL under `/api` with a method other than
   `GET` (e.g. `POST /api/cities`), **Then** the response is `404` or `405` — no route exists that
   would accept it (spec `001-platform-foundation-npm` FR-007 / constitution Principle III).

---

### User Story 3 - A visitor can tell how fresh the data is (Priority: P2)

Because weather is only ever pulled on a schedule, a consumer needs to know when it was last
successfully refreshed, both as its own endpoint and attached to city/forecast responses.

**Why this priority**: Directly supports the constitution's requirement that the public surface be
transparently read-only and non-interactive — freshness is the substitute for a "refresh" button.

**Independent Test**: Request `GET /api/meta/freshness` and confirm it reflects the most recent
`succeeded` `ingest_runs` row's timestamp; compare against a city response's freshness field.

**Acceptance Scenarios**:

1. **Given** at least one successful ingest run has completed, **When** a client requests
   `GET /api/meta/freshness`, **Then** the response includes the provider name and the timestamp of
   the most recent successful run.
2. **Given** the same state, **When** a client requests `GET /api/cities/:slug`, **Then** the
   response includes the `ingest_runs` timestamp its observation came from.

### Edge Cases

- What happens when the worker runs before any city is seeded? → Zero cities to iterate; the
  ingest run for that cycle records `success` having processed zero cities (not an error state).
- What happens when Open-Meteo returns a shape that doesn't validate against the expected schema?
  → Treated the same as a fetch failure for that city: recorded as a failure, cycle continues for
  other cities, nothing invalid is written to observations/forecasts.
- What happens when two scheduled cycles would overlap (a cycle takes longer than the interval)?
  → The worker does not start a new cycle while one is in progress; it logs and waits for the next
  tick after the current cycle finishes.
- What happens when a client requests a forecast `range` value that isn't `hourly` or `daily`? →
  `400` with a JSON error body naming the allowed values.
- How does the API behave if the database is briefly unreachable? → `503` with a JSON error body;
  the process does not crash and recovers automatically once the database is reachable again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The ingestion worker MUST run as a process separate from the API (per constitution
  Technology & Delivery Constraints), connecting to Postgres only with the `weather_ingest` role's
  credentials.
- **FR-002**: On startup, the worker MUST run one ingestion cycle immediately, then continue on a
  fixed schedule (hourly), without requiring an external trigger.
- **FR-003**: For each city, the worker MUST fetch current conditions and both hourly and daily
  forecasts from Open-Meteo, validate the response shape, and upsert the results into
  `observations`, `forecast_hourly`, and `forecast_daily` respectively, keyed on each table's
  unique (city, valid-time) constraint.
- **FR-004**: Every cycle MUST create one `ingest_runs` row recording overall status
  (`success`/`failed`); a failure for one city MUST NOT mark the whole cycle `failed` if other
  cities succeeded — the run's `error` field records which cities failed and why, and the cycle is
  still `success` overall as long as at least the run itself completed.
- **FR-005**: The worker MUST NOT crash the process on a single city's fetch/validation failure; it
  MUST log the failure and continue with the remaining cities.
- **FR-006**: The worker MUST NOT run a new ingestion cycle while a previous cycle is still in
  progress.
- **FR-007**: The API MUST expose no data-mutating route (`POST`/`PUT`/`PATCH`/`DELETE`); this MUST
  continue to be enforced by an automated test asserting the Fastify route table contains none of
  those methods (constitution Principle III / spec `001` FR-007). `HEAD` (Fastify's automatic,
  non-mutating counterpart to each `GET` route) and `OPTIONS` (CORS preflight) are not data-mutating
  and are not restricted by this requirement.
- **FR-008**: The API MUST connect to Postgres only with the `weather_api` role's credentials.
- **FR-009**: The API MUST expose: `GET /api/health`, `GET /api/cities`, `GET /api/cities/:slug`,
  `GET /api/cities/:slug/forecast?range=hourly|daily`, `GET /api/meta/freshness`.
- **FR-010**: All API request/response shapes MUST be validated with zod schemas; an invalid
  `range` query parameter MUST return `400` with a machine-readable error body, not a 500.
- **FR-011**: An unknown city slug MUST return `404` with a JSON error body from every
  `/api/cities/:slug*` route.
- **FR-012**: The API MUST serve a generated OpenAPI document at `GET /api/openapi.json` and a
  human-browsable form at `GET /api/docs`, both derived from the same zod schemas used for
  validation (no hand-maintained duplicate contract).
- **FR-013**: All database access from both the worker and the API MUST go through typed
  repository functions in `packages/db`; neither process composes SQL from external input.
- **FR-014**: Every observation and forecast row the API returns MUST include a human-readable
  weather label (and icon key) resolved via a join against `weather_codes` in the repository layer
  — added once `003-accessible-forecast-browser` needed a real label to display; the consuming UI MUST NOT
  maintain its own copy of the WMO code table (constitution Principle IV: no denormalized
  duplication of lookup data).

### Key Entities *(include if feature involves data)*

No new entities — this feature is the first read/write consumer of the entities defined in
`001-platform-foundation-npm` (cities, providers, ingest_runs, observations, forecast_hourly,
forecast_daily, weather_codes, measurement_types/units/provider_units).

## Accessibility

Not applicable — this feature exposes no user interface (a worker process and a JSON HTTP API).
The forecast browser UI that consumes this API is `003-accessible-forecast-browser`, whose spec carries the
full accessibility contract per constitution Principle I.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Within one worker cycle after `docker compose up`, 100% of seeded cities have at
  least one observation row and at least 24 hourly + 7 daily forecast rows.
- **SC-002**: Re-running an ingestion cycle against unchanged upstream data produces zero net new
  rows for valid times already ingested (upsert, not duplicate) — verified by an automated test.
- **SC-003**: 0% of API routes accept a data-mutating method (`POST`/`PUT`/`PATCH`/`DELETE`); an
  automated test fails the build if any such route is ever registered.
- **SC-004**: A single city's ingestion failure never prevents the other cities in the same cycle
  from succeeding, verified by an automated test using a mocked failing fetch for one city.
- **SC-005**: `GET /api/openapi.json` validates as a well-formed OpenAPI document.

## Assumptions

- Open-Meteo's free/no-key forecast endpoint remains available with no authentication, matching
  the choice already recorded in the constitution.
- "Hourly" schedule granularity is sufficient for a portfolio demo; Open-Meteo itself does not
  update source data more often than that in any way this project depends on.
- No pagination is required for `GET /api/cities` at this project's scale (a dozen seeded cities).
- Tests for the worker's Open-Meteo integration use recorded fixture responses rather than live
  network calls, so CI has no external dependency (constitution Principle II, `references/testing.md`
  conventions extended to non-UI integration tests).

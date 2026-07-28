# Feature Specification: Platform Foundation

**Feature Branch**: `001-platform-foundation-npm`

**Created**: 2026-07-27

**Status**: Implemented

**Input**: User description: "platform foundation: npm workspaces monorepo scaffold, normalized
Postgres schema via Drizzle, docker compose stack, and base CI pipeline"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clone and run the whole stack with one command (Priority: P1)

A developer evaluating this portfolio project clones the repository and runs a single Docker
command. Postgres comes up, schema migrations apply automatically, and the database is seeded with
a starter set of cities — with no manual configuration beyond copying an example env file.

**Why this priority**: Without this, nothing else in the project (API, ingestion, UI) can be
demonstrated. It is the foundation every later feature builds on.

**Independent Test**: Run `cp .env.example .env && docker compose up --build`; connect to the
Postgres container and confirm the `cities`, `regions`, `providers`, `weather_codes`, `units`,
`measurement_types`, `ingest_runs`, `observations`, `forecast_hourly`, and `forecast_daily` tables
exist, migrations are recorded, and `cities` contains seeded rows.

**Acceptance Scenarios**:

1. **Given** a fresh clone with Docker installed, **When** the developer runs
   `docker compose up --build` after copying `.env.example` to `.env`, **Then** a one-shot migrate
   step applies all checked-in migrations before any other service starts, and exits 0.
2. **Given** the migrate step has completed, **When** the developer inspects the `cities` table,
   **Then** it contains the seeded starter cities with valid region and coordinate data.
3. **Given** the stack is running, **When** a query is attempted using the API's database
   credentials against a write operation (e.g. `INSERT INTO cities ...`), **Then** Postgres denies
   it with a permissions error.

**Independent Test yields value on its own**: proves the schema, migrations, roles, and container
wiring all work together before any application code exists.

---

### User Story 2 - Contributor gets fast, uniform feedback on a change (Priority: P2)

A contributor opens a pull request. Automated checks run lint (including the 600-line file-size
rule), type-checking, and unit tests against a real Postgres service container, without the
contributor doing anything beyond pushing.

**Why this priority**: Establishes the quality gate every later feature (ingestion, API, UI) will
be held to; needed before there is meaningful application code to check.

**Independent Test**: Open a pull request that adds a file exceeding 600 lines; confirm CI fails on
the lint step with a `max-lines` violation and no other job needs to run for the failure to be
visible.

**Acceptance Scenarios**:

1. **Given** a pull request is opened, **When** CI runs, **Then** it executes install, lint,
   typecheck, and unit test steps in that order and reports pass/fail per step.
2. **Given** a source file exceeds 600 lines, **When** lint runs, **Then** CI fails with a
   `max-lines` violation naming the file.
3. **Given** `packages/db` has pending migrations, **When** CI runs, **Then** it applies them
   against a `postgres:16` service container and runs a smoke query before unit tests that depend
   on schema shape.

---

### User Story 3 - Engineer adds a package without fighting the repo layout (Priority: P3)

An engineer extends the system (e.g. adds the ingestion worker in a later feature) and can rely on
a consistent workspace convention: a `packages/<name>` directory with its own `package.json`,
TypeScript config extending the shared base, and test runner wiring already in place.

**Why this priority**: Lower priority than the runnable stack and CI gate, but avoids every future
feature re-deriving monorepo conventions from scratch.

**Independent Test**: Add a trivial new workspace package, run `npm install` at the root, and
confirm the package is picked up by the root lint/typecheck/test scripts without additional
configuration.

**Acceptance Scenarios**:

1. **Given** a new directory under `packages/` with a `package.json` naming it as a workspace,
   **When** `npm install` runs at the repo root, **Then** the package is linked and its
   dependencies resolved without per-package `npm install`.
2. **Given** the new package extends `tsconfig.base.json`, **When** `npm run typecheck` runs at the
   root, **Then** the package is included in the typecheck without a separate command.

### Edge Cases

- What happens when `docker compose up` runs against a Postgres data volume from a previous,
  older migration state? → The migrate step applies only pending migrations in order and is
  idempotent on repeat runs; it must not attempt to re-run applied migrations.
- What happens when the API's database credentials are used to attempt a write? → Denied at the
  database role level (Postgres permission error), independent of any application-layer check.
- What happens when CI runs on a fork without repository secrets? → The base CI pipeline (lint,
  typecheck, unit, migrations) requires no secrets; only the (later, separate) release pipeline
  that publishes images needs registry credentials.
- How does the system handle a `package.json` in `packages/*` that omits required scripts (`lint`,
  `typecheck`, `test`)? → The root orchestration script for that check is skipped for that package
  with a warning rather than failing the whole run, so partially-scaffolded packages don't block
  unrelated work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST be an npm workspaces monorepo rooted at `package.json`, with
  application code under `packages/*`.
- **FR-002**: All packages MUST share a single TypeScript base configuration
  (`tsconfig.base.json`) that each package's `tsconfig.json` extends.
- **FR-003**: The root MUST provide `lint`, `typecheck`, `test`, and `format` scripts that fan out
  to every workspace package.
- **FR-004**: ESLint MUST be configured with a `max-lines` rule capped at 600 for all source files,
  enforced as an error, not a warning.
- **FR-005**: The database schema MUST be defined with Drizzle ORM in `packages/db`, normalized to
  third normal form: cities reference regions by foreign key; observations and forecasts reference
  weather codes and units by foreign key rather than storing free-text or bare numeric-with-unit
  columns.
- **FR-006**: Every schema change MUST be expressed as a generated, checked-in SQL migration file
  under `packages/db/migrations`; no `drizzle-kit push` usage in any environment.
- **FR-007**: The system MUST define three Postgres roles: an owner role (runs migrations, owns all
  objects), an ingest role (SELECT/INSERT/UPDATE on data tables only), and an api role (SELECT
  only on all present and future tables in the schema).
- **FR-008**: A seed script MUST populate at least 10 cities across at least 3 regions with valid
  coordinates and timezones, runnable idempotently (safe to run more than once).
- **FR-009**: `docker-compose.yml` MUST define a Postgres service, a one-shot migrate service that
  applies migrations and roles then exits, and MUST order service startup so migrations complete
  before any service that depends on schema being present.
- **FR-010**: Each container image MUST be built via a multi-stage Dockerfile and MUST run its
  process as a non-root user.
- **FR-011**: `.env.example` MUST enumerate every environment variable the compose stack requires,
  with safe non-secret placeholder values for local development.
- **FR-012**: GitHub Actions CI MUST run on pull requests and pushes to `main`, executing install,
  lint, typecheck, and unit test steps, plus applying `packages/db` migrations against a
  `postgres:16` service container followed by a schema smoke check.
- **FR-013**: CI MUST fail the pull request if any step fails; step order MUST surface fast
  failures (lint/typecheck) before slower steps (migrations/tests against a live database).

### Key Entities *(include if feature involves data)*

- **Region**: A country or administrative area a city belongs to; has a name and ISO code.
- **City**: A named location with latitude/longitude, timezone, a URL-safe slug, and a region
  reference. The unit of navigation for every later feature.
- **Provider**: A weather data source (Open-Meteo in this project) with an attribution URL and
  license note; referenced by ingest runs so no source string is duplicated on data rows.
- **WeatherCode**: A lookup of WMO weather interpretation codes to a human-readable label and an
  icon key; referenced by foreign key from observations/forecasts, never denormalized to text.
- **Unit / MeasurementType**: Lookup tables so numeric columns (temperature, wind speed,
  precipitation) carry no unit suffix in their name and the unit is queryable data, not a naming
  convention.
- **IngestRun**: One execution of the ingestion job — provider, start/finish timestamps, status,
  and error detail if any. Powers a "data last updated" indicator in later features.
- **Observation**: A single current-conditions reading for a city at a point in time, linked to the
  ingest run that produced it; unique on (city, observed-at).
- **ForecastHourly / ForecastDaily**: Forecast rows for a city at a specific valid hour or date,
  linked to the ingest run that produced them; unique on (city, valid time) so re-ingestion upserts
  instead of duplicating.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with Docker installed can go from `git clone` to a running, seeded
  Postgres database in under 5 minutes using only commands documented in the README.
- **SC-002**: 100% of schema objects are created via checked-in migration files; zero manual `psql`
  DDL is required to reach the schema state described in Key Entities.
- **SC-003**: An attempted write using the API role's credentials fails 100% of the time with a
  Postgres permission error, verified by an automated test.
- **SC-004**: CI completes lint + typecheck + unit + migration-smoke on a pull request with no
  application feature code in under 5 minutes.
- **SC-005**: Zero source files in the repository exceed 600 lines, enforced by a failing CI check
  if violated.

## Assumptions

- Docker and Docker Compose (v2, `docker compose`) are available in every environment this project
  is evaluated in, including CI runners.
- Postgres 16 is an acceptable target version; no requirement was given to support older versions.
- This feature ships no application behavior (API routes, ingestion, UI) — those are separate
  specs (`002-weather-ingestion-worker`, `003-accessible-forecast-browser`) that build on this foundation.
- "10+ cities across 3+ regions" is a reasonable stand-in for "starter dataset"; the exact city list
  is an implementation decision, not a product requirement.
- No secrets are required to run the base CI pipeline; publishing images to a registry (covered
  later, in the CI/CD completion work) is a separate, secret-requiring workflow.

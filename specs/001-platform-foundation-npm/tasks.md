---
description: "Task list for 001-platform-foundation-npm"
---

# Tasks: Platform Foundation

**Input**: Design documents from `/specs/001-platform-foundation-npm/`
**Prerequisites**: plan.md, spec.md

**Tests**: Included — constitution Principle II requires tests at every layer from the start.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create root `package.json` (npm workspaces: `packages/*`) with `lint`, `typecheck`,
      `test`, `format` scripts that fan out via `npm run <script> --workspaces --if-present`
- [x] T002 Create `tsconfig.base.json` (strict mode, ES2022 target, NodeNext module resolution)
- [x] T003 [P] Create `eslint.config.js` (flat config, `typescript-eslint`, `max-lines: ["error",
      {"max": 600, "skipBlankLines": true, "skipComments": true}]`)
- [x] T004 [P] Create `.prettierrc.json` and a `format`/`format:check` script
- [x] T005 [P] Create stub `packages/{api,ingest,ui,web}/package.json` + `tsconfig.json` (valid,
      buildable, no real source yet) so root scripts fan out to them starting now

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Normalized schema, migrations, roles, seed — everything later features read from.

- [x] T006 [US1] Create `packages/db/package.json`, `tsconfig.json`, `drizzle.config.ts`
- [x] T007 [US1] Define lookup schema in `packages/db/src/schema/lookups.ts`: `weather_codes`
      (code, label, icon_key), `measurement_types`, `units` (so numeric columns carry no unit
      suffix)
      Test: `packages/db/src/schema/lookups.test.ts` (table shape / constraint assertions via
      Drizzle's schema introspection)
- [x] T008 [US1] Define `regions` and `cities` schema in `packages/db/src/schema/regions.ts`,
      `packages/db/src/schema/cities.ts` — `cities.region_id` FK to `regions`, unique `slug`
- [x] T009 [US1] Define `providers` schema in `packages/db/src/schema/providers.ts`
- [x] T010 [US1] Define `ingest_runs` schema in `packages/db/src/schema/ingest-runs.ts`
      (provider_id FK, started_at, finished_at, status, error)
- [x] T011 [US1] Define `observations`, `forecast_hourly`, `forecast_daily` schema in
      `packages/db/src/schema/observations.ts`, `packages/db/src/schema/forecasts.ts` — FKs to
      `cities`, `ingest_runs`, `weather_codes`, `units`; unique constraints on (city, observed_at)
      / (city, valid_at) / (city, valid_date) so re-ingestion upserts
- [x] T012 [US1] Barrel-export all tables from `packages/db/src/schema/index.ts`
- [x] T013 [US1] Generate the initial checked-in migration with `drizzle-kit generate` into
      `packages/db/migrations/`
      Done when: migration SQL file exists, is reviewed for FK/unique constraints matching T007–T011
- [x] T014 [US1] Write `packages/db/roles.sql`: `weather_owner`, `weather_ingest`
      (SELECT/INSERT/UPDATE on data tables), `weather_api` (SELECT only, `ALTER DEFAULT
      PRIVILEGES` for future tables)
      Test: `packages/db/roles.test.ts` — connect as `weather_api`, assert INSERT is denied (SC-003)
- [x] T015 [US1] Implement `packages/db/src/client.ts` (pg Pool + drizzle instance, connection
      string from env, distinct exports/entry for owner vs. api-role connections)
- [x] T016 [US1] Implement `packages/db/src/migrate.ts` (applies pending migrations
      programmatically; idempotent — safe to re-run against an already-migrated database)
      Done when: running it twice in a row against the same database is a no-op the second time
      Test: `packages/db/src/migrate.test.ts`
- [x] T017 [US1] Implement `packages/db/src/seed.ts` — at least 10 cities across at least 3
      regions, idempotent upsert on `slug`
      Test: `packages/db/src/seed.test.ts` — running twice yields the same row count

**Checkpoint**: Schema, migrations, roles, and seed all exist and are independently testable
against a local Postgres instance.

---

## Phase 3: User Story 1 - Clone and run the whole stack with one command (Priority: P1) 🎯 MVP

**Goal**: `docker compose up --build` migrates, applies roles, seeds, and leaves a running,
queryable, correctly-permissioned Postgres.

**Independent Test**: Per spec.md US1 — inspect tables and seeded rows after compose up; attempt a
write as the api role and confirm denial.

### Implementation for User Story 1

- [x] T018 [US1] Write `docker/Dockerfile.migrate` (multi-stage, non-root user; runs
      `migrate.ts` then `roles.sql` then `seed.ts`, then exits 0)
- [x] T019 [US1] Write `docker-compose.yml`: `postgres` service (16, named volume, healthcheck),
      `migrate` service (`depends_on: postgres: condition: service_healthy`, runs to completion)
- [x] T020 [US1] Write `.env.example` enumerating every variable the compose stack reads
      (`POSTGRES_*`, `DATABASE_URL_OWNER`, `DATABASE_URL_INGEST`, `DATABASE_URL_API`)
- [x] T021 [US1] Manual verification: `docker compose up --build`, confirm migrate exits 0, tables
      exist, cities are seeded, and a write attempt with the api role's connection string is denied
      Test: this is the acceptance scenario itself — record the result in this task's checkpoint

**Checkpoint**: User Story 1 fully functional — a fresh clone reaches a seeded, correctly
permissioned database with one command.

---

## Phase 4: User Story 2 - Contributor gets fast, uniform feedback (Priority: P2)

**Goal**: CI enforces lint (incl. 600-line rule), typecheck, unit tests, and migration smoke on
every PR, with no application feature code yet to test beyond `packages/db`.

### Implementation for User Story 2

- [x] T022 [P] [US2] Configure Vitest at the workspace root (`vitest.config.ts` with per-package
      `packages/*/vitest.config.ts` or a single root config with `projects`)
- [x] T023 [US2] Write `.github/workflows/ci.yml`: install (with npm cache) → lint → typecheck →
      unit → start `postgres:16` service container → run migrate → run smoke query
      Done when: a PR that adds a >600-line file fails at the lint step specifically (SC-005)
- [x] T024 [US2] Add a smoke-check script `packages/db/src/smoke.ts` (connects, selects seeded
      city count > 0) invoked as the last CI step
      Test: exit non-zero if the seeded count is 0

**Checkpoint**: Both User Stories 1 and 2 work independently; CI is green on this branch's own PR.

---

## Phase 5: User Story 3 - Engineer adds a package without fighting the layout (Priority: P3)

### Implementation for User Story 3

- [x] T025 [US3] Confirm (via T005's stub packages) that `npm install` at the root links all five
      `packages/*` without per-package installs, and that `npm run lint`/`typecheck`/`test`
      already include them — document the convention briefly in root `README.md`

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T026 [P] Root `README.md`: quickstart (`cp .env.example .env && docker compose up --build`),
      workspace layout explanation
- [x] T027 Run `npm run lint`, `npm run typecheck`, `npm test` at the root and fix any violation
      before considering this feature complete (constitution Principle II re-run rule)

---

## Dependencies & Execution Order

- Setup (T001–T005) has no dependencies.
- Foundational (T006–T017) depends on Setup; blocks all user stories.
- US1 (T018–T021) and US2 (T022–T024) both depend on Foundational; can proceed in parallel.
- US3 (T025) depends on Setup only (documentation task).
- Polish (T026–T027) depends on US1 and US2 being complete.

## Notes

- No `[Story]` accessibility Done-when/Test lines appear above because this feature renders no UI
  (spec.md omits `## Accessibility` per the template's own opt-out for non-UI features).
- Every implementation task above still carries a `Test:` or `Done when:` line per the tasks
  template's Testing rule (constitution Principle II).

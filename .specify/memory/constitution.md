<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (patch: wording/technology-reference correction)
- Modified principles: none (Technology & Delivery Constraints' Stack line only — Drizzle ORM /
  drizzle-kit → Prisma ORM / Prisma Migrate; Principle IV was already tool-agnostic and needed no
  change)
- Added sections: none
- Removed sections: none
- Templates requiring updates: none (no template references the ORM by name)
- Follow-up TODOs: none.

Prior report (1.0.0, initial ratification):
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first fill of template placeholders)
- Added sections: Core Principles (I–VI), Technology & Delivery Constraints, Development Workflow,
  Governance
- Removed sections: none (placeholder tokens only)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — generic "[Gates determined based on constitution
    file]" placeholder already defers to this document; no structural change needed.
  - ✅ .specify/templates/spec-template.md — updated in the same change set to add a mandatory
    `## Accessibility` section (Principle I).
  - ✅ .specify/templates/tasks-template.md — updated in the same change set to require a
    `Done when:` / `Test:` accessibility criterion on every UI task (Principle I) and named tests
    per implementation task (Principle II).
  - ⚠ .specify/templates/checklist-template.md — not modified; generic enough to remain as-is.
  - N/A — no `speckit.*`/`speckit-*` command files reference outdated agent-specific names.
- Follow-up TODOs: none.
-->

# weather-demo Constitution

## Core Principles

### I. Accessibility Is Non-Negotiable (WCAG 2.2 AA)

Every user-facing surface MUST conform to WCAG 2.2 AA. This project follows
`.github/skills/building-accessible-ui/SKILL.md` as the mechanical checklist and its
`references/spec-driven-development.md` as the process: the accessibility contract (components
used, accessible names, keyboard and focus behavior, ARIA state, live regions, testing strategy,
known limitations) MUST be written into a feature's spec before implementation begins, using the
skill's stable section keys (`components`, `labels`, `grouping`, `keyboard`, `dynamic_state`,
`status_messages`, `testing`, `known_limitations`). A spec that renders UI without this contract is
under-specified and MUST NOT proceed to implementation. No output may be described as "fully
accessible"; known gaps MUST be recorded with the affected persona. Rationale: accessibility
decisions are cheap to make at spec time and expensive to retrofit after review; making the
contract a gate keeps it from being cut under schedule pressure.

### II. Test-First, Every Layer (NON-NEGOTIABLE)

No feature is complete without both automated unit tests and, for anything a user can navigate,
Playwright end-to-end tests. Every rendered UI surface MUST carry an automated accessibility scan
(axe or equivalent) as part of its test suite, per `references/testing.md`: writing or configuring
a test is not sufficient, it MUST be executed, violations fixed, and the final run MUST be against
the exact artifact being submitted — re-run after any post-test edit. Tests are written alongside
(not after) the implementation task they verify; a task that adds UI or an API route without a
named test file is under-specified. Rationale: a public-facing demo with no write path to recover
from is only trustworthy if regressions are caught before merge, not after deploy.

### III. Public Surface Is Read-Only

The application is public-facing and MUST provide no path for a visitor to create, modify, or
delete data. This is enforced in depth, not by convention alone: (a) the API process connects to
Postgres with a database role granted `SELECT` only; (b) the API MUST expose no route with a
method other than `GET`, and this MUST be asserted by an automated test; (c) all queries go
through typed repository functions in the database package — request input is never composed into
raw SQL. Data enters the system exclusively through a scheduled ingestion job running as a separate
process with its own write-scoped database role. Rationale: a portfolio demo left open to the
internet is a target; the read-only guarantee must survive a bug in any single layer.

### IV. Schema Discipline: Normalized and Migration-Driven

The database schema MUST be normalized (third normal form as the default target; denormalize only
with a written rationale in the relevant spec). Every schema change MUST ship as a generated,
checked-in migration file — direct schema pushes to any shared environment (including CI and
Docker) are prohibited. Lookup values (weather codes, units, providers) are referenced by foreign
key, never duplicated as free-text columns. Rationale: a normalized, migration-versioned schema is
what makes the "how would you evolve this" conversation answerable in a portfolio setting, and
prevents silent drift between environments.

### V. Small, Single-Concern Files

Every source file (React, Node, SQL, config) is scoped to one concern and MUST NOT exceed 600 lines
of code. This is enforced mechanically via lint configuration (`max-lines`), not left to review
judgment. When a file approaches the limit, split by concern (e.g., separate the schema definition
from the repository functions, separate a component from its variants) rather than suppressing the
rule. Rationale: monolithic files are the single most common way a demo codebase stops reading like
a portfolio piece; a hard, automated ceiling keeps decomposition honest.

### VI. Conventional Commits and Traceable History

Every commit MUST follow Conventional Commits (`<type>[optional scope]: <description>`, imperative
lowercase description, `!` or a `BREAKING CHANGE:` footer for breaking changes) as already
specified in `CLAUDE.md`. Feature work MUST be traceable to its spec: implementation commits
reference the `specs/NNN-*` feature they implement. Rationale: consistent history is what lets a
reviewer (or a future agent) reconstruct why a change happened without re-deriving it from the
diff.

## Technology & Delivery Constraints

- **Stack**: React (Vite) SPA, Node.js (Fastify) API, PostgreSQL via Prisma ORM with
  Prisma Migrate-generated migrations, Tailwind CSS, React Aria Components as the accessible
  component library, TypeScript throughout.
- **Architecture**: npm workspaces monorepo (`packages/db`, `packages/api`, `packages/ingest`,
  `packages/ui`, `packages/web`) so the database layer, API layer, ingestion worker, and component
  library are independently buildable and testable, per Principle V.
- **Containerization**: The full stack MUST run via `docker compose up` with no manual setup step
  beyond providing environment variables; images use multi-stage builds and run as non-root users.
- **CI/CD**: GitHub Actions MUST run lint, typecheck, unit tests, migrations, and Playwright e2e
  (including the accessibility scan) on every pull request; tagged releases MUST build and publish
  container images.
- **Data source**: Weather data is pulled from a provider requiring no secret credential (Open-Meteo)
  so the repository is runnable by anyone who clones it, in CI and locally, without provisioning an
  API key.

## Development Workflow

- Features are planned through the spec-kit cycle (`/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`), one `specs/NNN-*` directory per feature.
- Any feature that touches the UI layer MUST invoke the `building-accessible-ui` skill while writing
  its spec, not only while implementing it (Principle I).
- A pull request MUST NOT merge with failing lint, typecheck, unit, migration, or e2e/axe checks.
- Before submitting work, re-check the spec's acceptance criteria (including its accessibility
  contract) against the shipped artifact; if implementation diverged from the spec, update the spec
  in the same change rather than leaving it stale.

## Governance

This constitution supersedes ad hoc practice for every principle it states. Amendments are made by
editing this file directly: propose the change, update the version per the rules below, and update
any dependent template (`plan-template.md`, `spec-template.md`, `tasks-template.md`) in the same
change so they never drift out of sync with the principles they enforce.

Versioning policy (semantic versioning applied to governance):
- **MAJOR** — a principle is removed or redefined in a backward-incompatible way.
- **MINOR** — a new principle or materially expanded section is added.
- **PATCH** — clarification, wording, or non-semantic refinement.

All specs, plans, and task lists MUST be checked against this constitution before implementation
begins (the "Constitution Check" gate in `plan-template.md`); a plan that cannot satisfy a principle
MUST record the conflict and justification in that plan's Complexity Tracking table rather than
silently deviating. Use `CLAUDE.md` for day-to-day agent operating instructions; this document is
the source of truth when the two disagree.

**Version**: 1.0.1 | **Ratified**: 2026-07-27 | **Last Amended**: 2026-07-28

# weather-demo — agent instructions

This file is read by Codex and other `AGENTS.md`-aware agents. Claude Code reads
[`CLAUDE.md`](CLAUDE.md) instead — the two must not drift, so this file states the same rules and
defers to `CLAUDE.md` and [`.specify/memory/constitution.md`](.specify/memory/constitution.md) as
the source of truth if anything here goes stale.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit:
`<type>[optional scope]: <description>`, imperative and lowercase (e.g. `feat: add disclosure
widget skill`). Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`,
`perf`, `style`. Use `!` after the type/scope or a `BREAKING CHANGE:` footer for breaking changes.

## Accessibility (non-negotiable)

Any code or spec that touches the UI layer — markup, components, styles, the JS/TS driving them,
or a spec/plan/PRD for a user-facing feature — MUST follow
[`.github/skills/building-accessible-ui/SKILL.md`](.github/skills/building-accessible-ui/SKILL.md)
(WCAG 2.2 AA). For specs specifically, the accessibility contract (components, labels, keyboard
behavior, live regions, testing strategy) goes in the spec _before_ implementation starts — see
that skill's `references/spec-driven-development.md`.

## Public surface is read-only (non-negotiable)

This app is public-facing and has no user-facing write path, enforced in depth: the API connects
to Postgres with a `SELECT`-only role, exposes no route with a method other than `GET`, and every
query goes through typed repository functions in `packages/db` — never raw SQL built from request
input. Data enters only through the scheduled ingestion worker (`packages/ingest`), which has its
own write-scoped role. Do not add a mutating API route or bypass the repository layer.

## Spec-driven workflow

Features are planned through the spec-kit cycle (`/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`), one `specs/NNN-*` directory per feature. Implementation
commits should reference the spec they implement.

## Versioned skill harness

Skills this repo owns live under `.github/skills/` (synced into `.claude/skills/` by
`scripts/sync-claude-skills.sh`) and are pinned by version + checksum in
[`.harness/manifest.json`](.harness/manifest.json). If you edit a skill under `.github/skills/`,
bump its `version` frontmatter field and update its checksum — run `npm run harness:check` to
verify and get the correct hash. This is checked in CI.

## Everyday commands

```sh
npm install
npm run lint          # ESLint, includes a 600-line-per-file ceiling
npm run typecheck      # tsc --noEmit across every workspace package
npm test               # Vitest — unit + packages/{db,api,ingest} integration tests
npm run test:e2e        # Playwright — needs a running stack (docker compose up --build -d)
npm run harness:check  # verifies the skill manifest above
```

See [`README.md`](README.md) for the full local-development and database setup.

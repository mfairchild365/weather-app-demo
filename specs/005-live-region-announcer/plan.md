# Implementation Plan: Shared Live-Region Announcer

**Branch**: `005-live-region-announcer` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-live-region-announcer/spec.md`

## Summary

Replace `packages/ui`'s per-component live regions with one shared announcer module. Today
`StatusMessage.tsx` is both the visible-text renderer and the live region (`role="status"` /
`role="alert"`), mounted independently four times across two pages. This plan extracts the
live-region half into `packages/ui/src/announcer.ts`: a module-level singleton that injects two
visually-hidden regions (polite + assertive) once, and a queue that serializes every announcement
in the app through them. `StatusMessage` keeps its visible text and existing `id`/`className`
props unchanged and calls `announce()` on message change instead of owning a region. No other
component, route, or copy string changes.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18

**Primary Dependencies**: None new. Pure DOM APIs (`document.createElement`, `setTimeout`) in
`packages/ui`; no dependency on React inside `announcer.ts` itself so it stays usable from any
future non-React surface in this workspace.

**Storage**: None.

**Testing**: Vitest + Testing Library + `vitest-axe` (as spec 003/004 established); `vi.useFakeTimers()`
for the announcer's own queue/timing tests. Playwright e2e re-run unmodified (id-based locators
are preserved).

**Target Platform**: Browser (evergreen), same as spec 003/004.

**Project Type**: Web application monorepo (continues `003`/`004`'s layout).

**Constraints**: Zero change to any message template, trigger, or accessible name from spec 004's
`status_messages`/`labels` tables; zero `serious`/`critical` axe violations (unchanged bar from
spec 003/004).

**Scale/Scope**: One new module, one modified component, two modified test files, one modified
route (`CityDetailPage`'s 404 branch gains an announcement).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Accessibility | Full contract in spec.md's `## Accessibility` section before this plan was written; reuses spec 003/004's role-based pattern (no raw `aria-live`), per `references/status-messages.md` | PASS |
| II. Test-first, every layer | New `announcer.test.tsx`; `StatusMessage.test.tsx` rewritten for the new contract; route tests updated; axe re-run | PASS |
| III. Public surface read-only | No backend change | PASS |
| IV. Normalized, migration-driven schema | No schema change | PASS |
| V. Small, single-concern files | `announcer.ts` is one module with one responsibility (queueing/writing announcements); `StatusMessage.tsx` stays under the existing size | PASS |
| VI. Conventional Commits | No change | PASS |

No violations — Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-live-region-announcer/
├── plan.md
└── spec.md
```

### Source Code (repository root)

```text
packages/ui/src/
├── announcer.ts                    # new: singleton queue + two visually-hidden live regions
├── announcer.test.tsx              # new
├── StatusMessage.tsx               # modified: renders visible text, calls announce() on change
├── StatusMessage.test.tsx          # rewritten for the new contract
└── index.ts                        # + export { announce, resetAnnouncer, ... }

packages/web/src/routes/
├── CityDetailPage.tsx              # modified: 404 branch calls announce() directly (FR-006)
├── CityDetailPage.test.tsx         # modified: role('alert') assertion -> id lookup; resetAnnouncer() in afterEach
├── CityListPage.tsx                # unchanged
└── CityListPage.test.tsx           # modified: role('status'|'alert') assertions -> id lookups; resetAnnouncer() in afterEach
```

No changes to `e2e/*.spec.ts` — all existing locators are id-based (`#city-list-status`, etc.),
and those ids are preserved.

**Structure Decision**: The announcer lives in `packages/ui`, not `packages/web`, because it is
consumed by `packages/ui`'s own `StatusMessage` component and has no dependency on
`packages/web`-specific code (routing, copy). This keeps the existing implementation-priority
pattern from spec 003/004: `packages/ui` is the shared, dependency-free component/utility layer;
`packages/web` composes it.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

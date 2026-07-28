# Implementation Plan: Accessible Forecast Browser

**Branch**: `003-accessible-forecast-browser` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-accessible-forecast-browser/spec.md`

## Summary

Build the public-facing SPA: `packages/ui` (an accessible component library on React Aria
Components + Tailwind) and `packages/web` (a Vite/React app consuming `002`'s read-only API). Two
routes — a searchable city list and a per-city forecast browser with Hourly/Daily tabs, an
accessible table paired with a decorative chart, and full keyboard/focus/live-region behavior per
the spec's Accessibility contract. Served in Docker behind nginx, which also reverse-proxies
`/api/*` to the `api` service so the browser only ever calls same-origin relative paths — no CORS
or baked-in API URL needed.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18

**Primary Dependencies**: React Aria Components (`packages/ui`), React Router, Vite, Tailwind CSS
(`packages/web`); Testing Library + `vitest-axe` (component-level a11y tests); Playwright +
`@axe-core/playwright` (e2e, already root devDependencies)

**Storage**: None — this feature never touches Postgres directly; all data comes from `002`'s API
over HTTP.

**Testing**: Vitest + Testing Library + `vitest-axe` for every `packages/ui` component and
`packages/web` page; Playwright + `@axe-core/playwright` for `e2e/*.spec.ts` (full-page scan,
keyboard-only journey, 320px reflow, `forced-colors: active`)

**Target Platform**: Browser (evergreen), served via nginx in Docker; Vite dev server locally

**Project Type**: Web application monorepo (continues `001`/`002`'s layout)

**Performance Goals**: Not a specific target for this demo; standard Vite production build
(code-split, minified) is sufficient

**Constraints**: No non-`GET` network calls anywhere in this feature (it only reads); WCAG 2.2 AA
per constitution Principle I; reflow at 320 CSS px; zero `serious`/`critical` axe violations

**Scale/Scope**: Two routes, ~12 cities, one API dependency

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Accessibility | Full contract in spec.md's `## Accessibility` section before this plan was written; component-priority ladder followed per-component in that section | PASS |
| II. Test-first, every layer | vitest-axe on every `ui`/`web` component; Playwright+axe e2e per page; both are this feature's own tasks, not deferred | PASS |
| III. Public surface read-only | This feature issues only `GET` requests; no new backend routes; nginx proxies to the existing read-only `api` service | PASS |
| IV. Normalized, migration-driven schema | No schema changes; consumes `002`'s weather-label join (FR-014) instead of duplicating the WMO code table on the client | PASS |
| V. Small, single-concern files | One component per file in `packages/ui`; one page/hook per file in `packages/web`; ESLint's 600-line ceiling already enforced repo-wide | PASS |
| VI. Conventional Commits | No change | PASS |

No violations — Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-accessible-forecast-browser/
├── plan.md
├── tasks.md
└── spec.md
```

### Source Code (repository root)

```text
packages/ui/src/
├── SkipLink.tsx                  # native <a>, first focusable element
├── SearchField.tsx                # wraps React Aria SearchField
├── Tabs.tsx                       # wraps React Aria Tabs/TabList/Tab/TabPanel
├── Table.tsx                      # thin styled native <table>/<caption>/<th> wrappers
├── StatusMessage.tsx               # role="status" | "alert" live region primitive
├── SparklineChart.tsx              # decorative inline SVG, aria-hidden
├── Button.tsx                      # wraps React Aria Button
├── tokens.css                      # design tokens (CSS custom properties) — contrast-checked
└── index.ts                        # barrel export
(each component paired with Component.test.tsx — vitest-axe + Testing Library)

packages/web/
├── index.html
├── vite.config.ts                  # dev-only proxy: /api -> http://localhost:3000
├── tailwind.config.ts               # content globs include ../ui/src
├── postcss.config.js
└── src/
    ├── main.tsx                     # ReactDOM root, BrowserRouter
    ├── App.tsx                      # shell: SkipLink, header, <Routes>, footer
    ├── lib/api-client.ts             # fetch wrapper for relative /api/* calls
    ├── hooks/
    │   ├── useCities.ts
    │   ├── useCityDetail.ts
    │   ├── useForecast.ts
    │   └── useFocusMainOnRouteChange.ts   # FR-010: focus <main> on route change
    ├── components/
    │   ├── CurrentConditions.tsx
    │   └── ForecastTable.tsx          # composes ui/Table + ui/SparklineChart
    └── routes/
        ├── CityListPage.tsx
        ├── CityDetailPage.tsx
        └── NotFoundPage.tsx
(each hook/component/page paired with its own .test.tsx)

docker/
├── Dockerfile.web                   # multi-stage: vite build -> nginx:alpine
└── nginx.conf                       # serves dist/, proxies /api/ -> api:3000

e2e/
├── city-list.spec.ts
├── city-detail.spec.ts
└── keyboard-navigation.spec.ts
```

**Structure Decision**: `packages/ui` has no backend dependency and is consumed as source (same
pattern as `db`/`api`/`ingest` — no separate build step, workspace symlink resolution). Tailwind
lives only in `packages/web` (the one package that actually ships a CSS build), with its content
globs covering both `web` and `ui` source so classes used in library components are included.
`packages/web` has no dependency on `packages/db` — it only ever calls the public API over HTTP,
keeping the "browser never touches the database" boundary structural, not just a convention.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

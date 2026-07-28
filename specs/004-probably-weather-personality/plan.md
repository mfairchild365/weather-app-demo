# Implementation Plan: Probably Weather — Personality Pass

**Branch**: `004-probably-weather-personality` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-probably-weather-personality/spec.md`

## Summary

Re-voice and re-skin the existing `003-accessible-forecast-browser` SPA in place — no new routes,
no new backend surface, no new interaction patterns. Centralize copy into
`packages/web/src/copy.ts`; extend `packages/ui/src/tokens.css` with a teal accent (contrast
re-verified in `tokens.test.ts`); add two new decorative `packages/ui` components
(`WeatherIcon.tsx`, `Mascot.tsx`) following the exact `SparklineChart.tsx` precedent (`aria-hidden`,
paired with existing accessible text, never the sole data source); add one pure presentation
function (`packages/web/src/lib/verdict.ts`); self-host a display typeface for headings only. Every
existing accessible-name, live-region, keyboard, and focus contract from spec 003 is preserved
unchanged — this feature only touches body copy, color values, and adds decorative visuals.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18 (unchanged from 003)

**Primary Dependencies**: None added. Reuses React Aria Components / Tailwind / the existing
`packages/ui` component set. The one new asset dependency is two self-hosted `.woff2` files
(Space Grotesk, SIL Open Font License) under `packages/web/public/fonts/` — no font-loading
library, no CDN.

**Storage**: None — presentation-only feature, no schema or API change.

**Testing**: Vitest + Testing Library + `vitest-axe` for every new/changed component and page
(same pattern as 003); Playwright + `@axe-core/playwright` e2e suite re-run against the new visuals
with no selector changes expected (spec 003's e2e tests select by role/accessible-name, not copy).

**Target Platform**: Unchanged — browser (evergreen) via nginx/Docker or Vite dev server.

**Project Type**: Web application monorepo (continues 001/002/003's layout); no new packages.

**Performance Goals**: Two woff2 files (~22KB + ~13KB) added to the initial page weight; loaded
with `font-display: swap` so this never blocks first paint or produces invisible text.

**Constraints**: Every accessible name, live-region template trigger, and keyboard/focus behavior
from spec 003 must remain intact — this is a re-skin, not a rebuild; zero new animation/motion
surface (spec 003's zero-animation baseline is preserved per this spec's Assumptions).

**Scale/Scope**: Same two routes as 003; ~7 files touched for copy, 2 new `packages/ui`
components, 1 new `packages/web/src/lib` module, `tokens.css`/`tokens.test.ts`, `index.html`,
`tailwind.config.ts`, `README.md`, `packages/api/src/openapi.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Accessibility | Full contract in spec.md's `## Accessibility` section before this plan was written; every new decorative element follows the ladder (tier 5, `aria-hidden`, justified) exactly as `SparklineChart.tsx` established in 003; every accessible name is explicitly unchanged | PASS |
| II. Test-first, every layer | `vitest-axe` on both new `packages/ui` components; `verdict.test.ts` for determinism; every existing test updated and re-run for zero axe violations; e2e forced-colors/reflow re-run against new visuals | PASS |
| III. Public surface read-only | No new routes, no new network calls; still zero non-`GET` requests | PASS |
| IV. Normalized, migration-driven schema | No schema change — consumes only fields (`weatherIconKey`, `temperature`, `isDay`) already present on the existing API response types | PASS |
| V. Small, single-concern files | `WeatherIcon.tsx`, `Mascot.tsx`, `verdict.ts`, `copy.ts` are each one concern in their own file; ESLint's 600-line ceiling applies as before | PASS |
| VI. Conventional Commits | No change | PASS |

No violations — Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-probably-weather-personality/
├── plan.md
├── tasks.md
└── spec.md
```

### Source Code (repository root)

```text
packages/ui/src/
├── WeatherIcon.tsx              # new: 14 iconKey -> inline SVG + fallback, aria-hidden
├── WeatherIcon.test.tsx
├── Mascot.tsx                   # new: decorative header mascot, aria-hidden
├── Mascot.test.tsx
├── tokens.css                    # extended: --color-accent, new --color-link/--color-focus hexes
├── tokens.test.ts                 # extended: new hex pairs added to the contrast matrix
└── index.ts                       # extended: export WeatherIcon, Mascot

packages/web/
├── index.html                     # <title>, new <meta description>, new <link rel="icon">
├── public/
│   ├── favicon.svg                # new
│   └── fonts/
│       ├── space-grotesk-500.woff2   # new, self-hosted
│       └── space-grotesk-700.woff2   # new, self-hosted
├── tailwind.config.ts              # extended: theme.extend.fontFamily.display
└── src/
    ├── copy.ts                     # new: centralized strings module (FR-001)
    ├── index.css                    # extended: @font-face declarations
    ├── App.tsx                      # copy.ts, Mascot
    ├── lib/verdict.ts                # new: getVerdict(temperature, iconKey, isDay) -> string
    ├── lib/verdict.test.ts           # new
    ├── components/
    │   ├── CurrentConditions.tsx     # + WeatherIcon, + verdict line
    │   └── ForecastTable.tsx         # + WeatherIcon per row
    └── routes/
        ├── CityListPage.tsx          # copy.ts, easter eggs
        ├── CityDetailPage.tsx        # copy.ts
        └── NotFoundPage.tsx          # copy.ts

packages/api/src/openapi.ts          # title/description text only

README.md                             # heading, intro, Specs index, Accessibility known_limitations
```

**Structure Decision**: No new packages and no new top-level directories beyond
`packages/web/public/fonts/`. Every change lands inside the existing `003` file set or as new
files following its exact per-file, single-concern pattern (one component/module per file, a
co-located `*.test.tsx`/`*.test.ts` for each). `copy.ts` and `verdict.ts` live in `packages/web/src`
rather than `packages/ui` because they are product-voice/presentation-logic, not reusable
accessible UI primitives — matching the existing boundary where `packages/ui` holds only
generic, reusable, accessibility-hardened components and `packages/web` holds this product's
specific pages, hooks, and content.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

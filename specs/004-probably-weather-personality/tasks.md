---
description: "Task list for 004-probably-weather-personality"
---

# Tasks: Probably Weather — Personality Pass

**Input**: Design documents from `/specs/004-probably-weather-personality/`
**Prerequisites**: plan.md, spec.md, `003-accessible-forecast-browser` implemented

**Tests**: Included — constitution Principle II. Every UI task below carries a `Done when:` a11y
criterion and a `Test:` line.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 [P] Download and vendor `packages/web/public/fonts/space-grotesk-{500,700}.woff2`
      (SIL Open Font License, self-hosted — no CDN dependency)
- [x] T002 [P] `packages/web/src/copy.ts`: centralized strings module — every string from spec
      003's page/component set plus this spec's new templates (FR-001)
      Test: covered indirectly by every page/component test importing from this module instead of
      literals (T009–T014)

## Phase 2: Foundational — tokens, fonts, mascot (Blocking Prerequisites)

- [x] T003 [US2] `packages/ui/src/tokens.css` + `packages/ui/src/tokens.test.ts`: add
      `--color-accent`, update `--color-link`/`--color-focus` to the new teal values in both light
      and dark blocks
      Done when: every new/changed pair meets its WCAG 2.2 AA threshold (text ≥4.5:1, focus
      indicator ≥3:1), computed not eyeballed (FR-006)
      Test: `tokens.test.ts`'s `it.each` contrast matrix, extended with the new hex values
- [x] T004 [P] [US2] `packages/web/src/index.css`: `@font-face` for Space Grotesk 500/700,
      `font-display: swap`; `packages/web/tailwind.config.ts`:
      `theme.extend.fontFamily.display = ['"Space Grotesk"', ...system fallback]`
      Done when: headings/brand use the display stack, body text does not; a blocked font request
      produces no invisible text (FR-007)
      Test: manual verification (network-blocked font check) noted in plan.md verification; no
      automated test needed for a CSS-only font-stack declaration
- [x] T005 [P] [US2] `packages/web/index.html`: add `<link rel="icon" href="/favicon.svg">` and
      `<meta name="description">` (both currently absent); `packages/ui/src/Mascot.tsx`: decorative
      inline SVG cloud, `aria-hidden="true"`, `currentColor` fill only
      Done when: favicon renders in the browser tab; mascot contributes no accessible node
      (FR-005, FR-008)
      Test: `packages/ui/src/Mascot.test.tsx` (`vitest-axe`, asserts `aria-hidden`)
- [x] T006 [US2] `packages/ui/src/WeatherIcon.tsx`: maps all 14 seeded `iconKey` values (`clear`,
      `mostly-clear`, `partly-cloudy`, `overcast`, `fog`, `drizzle`, `freezing-drizzle`, `rain`,
      `freezing-rain`, `rain-showers`, `snow`, `snow-showers`, `thunderstorm`,
      `thunderstorm-hail`) to inline SVGs plus a fallback for any other value; `aria-hidden="true"`,
      `currentColor` only
      Done when: every one of the 14 keys plus one unrecognized key renders without throwing or
      producing a broken/missing image (FR-004, SC-002)
      Test: `packages/ui/src/WeatherIcon.test.tsx` (`vitest-axe` + a parametrized render over all
      14 keys + one unknown key)
- [x] T007 `packages/ui/src/index.ts`: export `WeatherIcon`/`WeatherIconProps` and
      `Mascot`/`MascotProps` from the barrel

**Checkpoint**: New tokens, font, mascot, and icon set exist and are individually tested; ready to
wire into pages.

---

## Phase 3: User Story 1 - Read the site in its own voice (Priority: P1) 🎯 MVP

- [x] T008 [US1] `packages/web/src/App.tsx`: brand text → `copy.brand` ("Probably Weather"),
      render `Mascot` beside it; footer text → `copy.footer` (link text/href unchanged)
      Test: `packages/web/src/App.test.tsx` updated for new copy, still zero axe violations
- [x] T009 [US1] `packages/web/src/routes/CityListPage.tsx`: heading, loading, error, no-matches
      templates → `copy.ts`; `document.title` → `copy.brand`
      Done when: every string matches spec's `status_messages`/`labels` tables; plain-language
      content ("couldn't load cities") still present in the alert text (FR-002)
      Test: `packages/web/src/routes/CityListPage.test.tsx` updated to assert new copy via `copy.ts`
- [x] T010 [US1] `packages/web/src/routes/CityDetailPage.tsx`: loading/error copy, not-found copy,
      `document.title` template → `copy.ts`
      Test: `packages/web/src/routes/CityDetailPage.test.tsx` updated
- [x] T011 [US1] `packages/web/src/routes/NotFoundPage.tsx`: heading/body/title → `copy.ts`
      Test: `packages/web/src/routes/NotFoundPage.test.tsx` updated
- [x] T012 [US1] `packages/api/src/openapi.ts`: title/description → "Probably Weather"-branded
      strings (FR-003)
      Test: existing `packages/api/src/openapi.test.ts` (or equivalent), assert new title string if
      such a test exists; otherwise manual `curl /api/openapi.json` check noted in verification

**Checkpoint**: Every page reads in the new voice; zero remaining "weather-demo" occurrences in
product-facing UI/API copy (SC-001).

---

## Phase 4: User Story 2 - Icons, mascot, and visual identity wired into the pages (Priority: P1)

- [x] T013 [US2] `packages/web/src/components/CurrentConditions.tsx`: render `WeatherIcon` beside
      `weatherLabel`, keyed off `observation.weatherIconKey`
      Done when: icon is `aria-hidden`; `weatherLabel` text remains unchanged and is still the
      accessible source of the condition (FR-004, FR-005)
      Test: `packages/web/src/components/CurrentConditions.test.tsx` updated (icon present,
      `aria-hidden`, axe clean)
- [x] T014 [US2] `packages/web/src/components/ForecastTable.tsx`: render `WeatherIcon` in the
      Conditions cell for both hourly and daily rows
      Test: `packages/web/src/components/ForecastTable.test.tsx` updated (both ranges, axe clean)

**Checkpoint**: Icons render everywhere `weatherLabel` does; visual identity (tokens, font,
favicon, mascot) fully wired from Phase 2.

---

## Phase 5: User Story 3 - The verdict + easter eggs (Priority: P2)

- [x] T015 [US3] `packages/web/src/lib/verdict.ts`: pure `getVerdict({ temperature, iconKey, isDay
      }): string`, banded on temperature × condition family × day/night, no randomness
      Done when: identical inputs always produce identical output; every one of the 14 seeded
      `iconKey` values produces a defined line with no throw (FR-009, SC-006)
      Test: `packages/web/src/lib/verdict.test.ts` (determinism assertions + full `iconKey` sweep)
- [x] T016 [US3] `packages/web/src/components/CurrentConditions.tsx`: render the verdict line as a
      plain `<p>` below the weather label, only when an observation is present
      Done when: verdict text is NOT inside a `role="status"`/`role="alert"` region — ordinary
      static content in document order (FR-009, Acceptance Scenario US3.2)
      Test: extends `CurrentConditions.test.tsx` — asserts the verdict paragraph is present and is
      not a descendant of any `[role="status"]`/`[role="alert"]` element
- [x] T017 [US3] `packages/web/src/routes/CityListPage.tsx`: recognize "xyzzy"/"atlantis"
      (case-insensitive, trimmed) and route to the fixed joke line through the existing
      `#city-list-status` region instead of the generic no-matches template
      Done when: all other query behavior is unchanged (FR-010)
      Test: extends `CityListPage.test.tsx` — two new cases asserting `#city-list-status` text for
      each easter-egg query

**Checkpoint**: All three user stories independently functional and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T018 [P] Re-run `e2e/city-list.spec.ts`, `e2e/city-detail.spec.ts`,
      `e2e/keyboard-navigation.spec.ts` against the new visuals — full-page axe scan, 320px
      reflow, `forced-colors: active`
      Done when: zero `serious`/`critical` violations; no new horizontal scroll; focus/tab
      indicators remain visible under forced colors (SC-003, SC-005)
      Test: these files are the test; no selector changes expected (role/name based)
- [x] T019 [P] Update root `README.md`: heading/intro to "Probably Weather", Specs index entry for
      `004`, Accessibility section's `known_limitations` gains the deadpan-copy limitation from
      spec.md
- [x] T020 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` against the
      exact artifact being submitted; fix any violation (constitution Principle II re-run rule)

---

## Dependencies & Execution Order

- Setup (T001–T002) has no dependencies.
- Foundational (T003–T007) depends on Setup; blocks US2's page-wiring tasks (T013–T014) and
  US1/US3's copy tasks depend only on T002.
- US1 (T008–T012) depends on T002 (copy.ts); independent of US2/US3.
- US2 (T013–T014) depends on Foundational (T003–T007); independent of US1/US3.
- US3 (T015–T017) depends on T002 (copy.ts is not required for verdict.ts itself, but T017 reuses
  `copy.ts` patterns) and, for T016, on US2's `CurrentConditions.tsx` icon wiring landing first to
  avoid repeated merge conflicts in the same file (not a hard technical dependency).
- Polish (T018–T020) depends on all three user stories.

## Notes

- Every UI task above carries a `Done when:` accessibility criterion and a `Test:` line — no bare
  "add accessibility" task exists, per constitution Principle I.
- No task modifies spec 003's `labels` table (accessible names) — verified by re-running spec
  003's own test files unmodified in assertion targets (role/name queries), only literal body-copy
  assertions change.

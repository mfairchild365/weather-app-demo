---
description: "Task list for 003-accessible-forecast-browser"
---

# Tasks: Accessible Forecast Browser

**Input**: Design documents from `/specs/003-accessible-forecast-browser/`
**Prerequisites**: plan.md, spec.md, `002-weather-ingestion-worker` implemented

**Tests**: Included — constitution Principle II. Every UI task below carries a `Done when:` a11y
criterion and a `Test:` line per constitution Principle I / the tasks template's Testing rule.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 [P] `packages/ui/package.json`, `tsconfig.json`: add `react`, `react-dom`,
      `react-aria-components`; add `@testing-library/react`, `@testing-library/jest-dom`,
      `vitest-axe`, `jsdom` as devDependencies (shared with `web`, installed at root)
- [x] T002 [P] `packages/web`: Vite + React scaffold (`vite.config.ts`, `index.html`,
      `tailwind.config.ts`, `postcss.config.js`), `react-router-dom` dependency
- [x] T003 [P] `packages/ui/src/tokens.css`: design tokens meeting ≥4.5:1 body text / ≥3:1 focus
      indicator contrast in both light and dark; imported once from `packages/web/src/main.tsx`
      Done when: token pairs verified against a contrast checker at authoring time (documented in
      the file's own comments); `prefers-color-scheme: dark` and `forced-colors: active` handled
      Test: `packages/ui/src/tokens.test.ts` (a plain script assertion computing contrast ratios
      for each documented text/background token pair)

## Phase 2: Foundational — shell, routing, data layer (Blocking Prerequisites)

- [x] T004 [US1,US2] `packages/web/src/lib/api-client.ts`: typed fetch wrapper for relative
      `/api/*` calls, throwing a typed error on non-2xx or network failure
      Test: `packages/web/src/lib/api-client.test.ts` (mocked fetch: success, 404, network error)
- [x] T005 [US1,US2] `packages/ui/src/SkipLink.tsx`: native `<a href="#maincontent">`, first
      focusable element
      Done when: accessible name is "Skip to main content"; visible only on focus; Enter moves
      focus to `<main id="maincontent" tabindex="-1">` (FR-009)
      Test: `packages/ui/src/SkipLink.test.tsx`
- [x] T006 [US1,US2,US3] `packages/web/src/hooks/useFocusMainOnRouteChange.ts`: moves focus to
      `<main>` on every route change
      Done when: navigating from `/` to `/cities/:slug` (and back) leaves focus on the new page's
      `<main>`, not the activated link (FR-010)
      Test: `packages/web/src/hooks/useFocusMainOnRouteChange.test.tsx`
- [x] T007 [US1,US2] `packages/web/src/App.tsx`: shell — `SkipLink`, `<header>` with a home link,
      `<main id="maincontent" tabindex="-1">` routed content, `<footer>` with Open-Meteo
      attribution; wires T006
      Done when: exactly one `<main>`; landmarks (`header`, `main`, `footer`) present; page
      `<title>` set per route
      Test: `packages/web/src/App.test.tsx` (landmark/heading structure, `vitest-axe`)

**Checkpoint**: Shell renders with correct landmarks and route-change focus behavior; ready for
page content.

---

## Phase 3: User Story 1 - Find a city (Priority: P1) 🎯 MVP

- [x] T008 [US1] `packages/ui/src/SearchField.tsx`: wraps React Aria `SearchField` (label,
      built-in clear button)
      Done when: accessible name is "Search cities" from a visible `<Label>`; clear button is
      keyboard-operable and returns focus to the input (spec `keyboard`)
      Test: `packages/ui/src/SearchField.test.tsx` (`vitest-axe` + Testing Library interaction)
- [x] T009 [US1] `packages/ui/src/StatusMessage.tsx`: `role="status"` / `role="alert"` live region
      primitive, rendered once, mutated via a `message` prop
      Done when: the DOM node exists before any message is set (never conditionally mounted);
      `politeness` prop selects `status` vs `alert` (spec `status_messages`)
      Test: `packages/ui/src/StatusMessage.test.tsx`
- [x] T010 [US1] `packages/web/src/hooks/useCities.ts`: fetches `GET /api/cities` via T004,
      exposes `{ status: 'loading' | 'success' | 'error', cities, error }`
      Test: `packages/web/src/hooks/useCities.test.ts`
- [x] T011 [US1] `packages/web/src/routes/CityListPage.tsx`: `h1`, `SearchField` (T008), live
      filtered `<ul>` of city links ("`<City>`, `<Region>`" accessible name), `#city-list-status`
      / `#city-list-error` (T009) per spec's `status_messages` table
      Done when: typing filters the list client-side with no network request; result count is
      announced via `#city-list-status`; zero matches shows the "No cities match" message; a fetch
      failure shows `#city-list-error` with a "Retry loading cities" button (FR-001–FR-003, FR-007)
      Test: `packages/web/src/routes/CityListPage.test.tsx` (`vitest-axe` on default, filtered,
      empty-result, and error states; Testing Library interaction for typing/retry)
- [x] T012 [US1] Wire `/` route in `packages/web/src/main.tsx`/`App.tsx` to `CityListPage`

**Checkpoint**: `/` lists and filters cities, independently testable and deployable.

---

## Phase 4: User Story 2 - See a city's current conditions and forecast (Priority: P1)

- [x] T013 [US2] `packages/ui/src/Tabs.tsx`: wraps React Aria `Tabs`/`TabList`/`Tab`/`TabPanel`
      Done when: one sequential tab stop on the tab list; Left/Right arrow keys move and activate
      Hourly/Daily; `aria-selected`/`aria-controls` managed by the component (spec `keyboard`,
      `dynamic_state`)
      Test: `packages/ui/src/Tabs.test.tsx` (`vitest-axe` + keyboard interaction via Testing
      Library `userEvent`)
- [x] T014 [US2] `packages/ui/src/Table.tsx`: thin styled wrappers for
      `<table>`/`<caption>`/`<thead>`/`<tbody>`/`<th scope="col">`/`<td>`
      Done when: `<caption>` is required (typed prop, not optional) so every table usage names
      itself (spec `labels`)
      Test: `packages/ui/src/Table.test.tsx`
- [x] T015 [US2] `packages/ui/src/SparklineChart.tsx`: decorative inline SVG line chart
      Done when: root SVG has `aria-hidden="true"`; renders from a plain `number[]` prop with no
      data-only-in-chart content (FR-006)
      Test: `packages/ui/src/SparklineChart.test.tsx` (asserts `aria-hidden`, absence from the
      accessibility tree via `vitest-axe`'s tree inspection)
- [x] T016 [US2] `packages/web/src/hooks/useCityDetail.ts` and `useForecast.ts`: fetch
      `GET /api/cities/:slug` and `GET /api/cities/:slug/forecast?range=...` via T004
      Test: `packages/web/src/hooks/useCityDetail.test.ts`,
      `packages/web/src/hooks/useForecast.test.ts`
- [x] T017 [US2] `packages/web/src/components/CurrentConditions.tsx`: temperature + `weatherLabel`
      + freshness text, or a "No current conditions yet" state
      Done when: the weather condition uses the API's `weatherLabel` (e.g. "Partly cloudy"), never
      a bare code (spec `labels`); freshness text reads "As of `<formatted time>`"
      Test: `packages/web/src/components/CurrentConditions.test.tsx` (`vitest-axe`, both states)
- [x] T018 [US2] `packages/web/src/components/ForecastTable.tsx`: composes T014 + T015 — Hourly
      view capped at the next 24 rows, Daily view all 7 rows; caption
      "`<City>` hourly forecast" / "`<City>` daily forecast"
      Test: `packages/web/src/components/ForecastTable.test.tsx` (`vitest-axe`, both ranges)
- [x] T019 [US2] `packages/web/src/routes/CityDetailPage.tsx`: `h1` (city name), T017, T013 tabs
      wrapping T018 per range, `#city-detail-status` / `#city-detail-error` (T009) loading/error
      handling with retry, "City not found" state for an unknown slug with a "Back to city list"
      link
      Done when: switching tabs swaps the table without a full page reload; a forecast fetch
      failure shows `#city-detail-error` with "Retry loading forecast" (FR-004, FR-005, FR-007,
      FR-008)
      Test: `packages/web/src/routes/CityDetailPage.test.tsx` (`vitest-axe` on loaded, loading,
      error, not-found, and both-tabs states)
- [x] T020 [US2] Wire `/cities/:slug` route to `CityDetailPage`; add a catch-all route to
      `NotFoundPage` (`packages/web/src/routes/NotFoundPage.tsx`) for unmatched paths
      Test: `packages/web/src/routes/NotFoundPage.test.tsx`

**Checkpoint**: Both user stories independently functional; `/cities/:slug` shows real data end
to end against the running API.

---

## Phase 5: User Story 3 - Navigate and operate the whole site by keyboard alone (Priority: P1)

US3 has no new components — it's the keyboard/focus contract already built into T005/T006/T013
and every interactive element from T008–T020. This phase adds the automated proof.

- [x] T021 [US3] `e2e/keyboard-navigation.spec.ts`: Playwright — from a fresh load of `/`, Tab
      through the entire page (skip link first), activate a city link, confirm focus lands on the
      new page's `<main>`, Tab to the tab list, use arrow keys to switch Hourly/Daily
      Done when: every interactive control is reachable and operable by keyboard alone with a
      visible focus indicator at each step (SC-002)
      Test: this file is the test (Acceptance Scenarios US3.1–US3.3)

**Checkpoint**: All three user stories independently functional and verified end to end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T022 [P] `docker/nginx.conf` + `docker/Dockerfile.web`: multi-stage `vite build` →
      `nginx:alpine` serving `dist/` and reverse-proxying `/api/` to `api:3000`; wire a `web`
      service into `docker-compose.yml`, `depends_on: migrate: condition:
      service_completed_successfully`
- [x] T023 [P] `e2e/city-list.spec.ts`: full-page `@axe-core/playwright` scan of `/` in default,
      filtered, and empty-result states
      Done when: zero `serious`/`critical` violations (SC-003)
      Test: this file is the test
- [x] T024 [P] `e2e/city-detail.spec.ts`: full-page axe scan of `/cities/:slug` (both tabs) and
      the not-found state; a 320 CSS px viewport reflow check; a `forced-colors: active` pass
      Done when: zero `serious`/`critical` violations; no horizontal scroll at 320px outside the
      table's own scroll container; focus/tab-selected indicators remain visible under forced
      colors (SC-003, SC-004, SC-005)
      Test: this file is the test
- [x] T025 Extend `.github/workflows/ci.yml`: add an e2e job — build the compose stack (or start
      `web`+`api`+`migrate`+`postgres` directly), install Playwright browsers, run `npm run
      test:e2e`, upload the HTML report and axe results as artifacts
- [x] T026 Update root `README.md`: architecture summary now includes `web`, Docker quickstart
      mentions the web UI's URL, and an **Accessibility** section stating what was tested (axe
      scope, keyboard journey, reflow, forced-colors) and the known limitations from spec.md — no
      "fully accessible" claim (constitution Principle I)
- [x] T027 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:e2e` against the
      exact artifact being submitted; fix any violation (constitution Principle II re-run rule)

---

## Dependencies & Execution Order

- Setup (T001–T003) has no dependencies.
- Foundational (T004–T007) depends on Setup; blocks all user stories.
- US1 (T008–T012) depends on Foundational.
- US2 (T013–T020) depends on Foundational; can proceed in parallel with US1 (different routes),
  though US2 benefits from US1's `StatusMessage`/`SkipLink` already existing.
- US3 (T021) depends on US1 and US2 being complete (it exercises both pages).
- Polish (T022–T027) depends on all three user stories.

## Notes

- Every UI task above carries a `Done when:` accessibility criterion and a `Test:` line — no bare
  "add accessibility" task exists, per constitution Principle I and
  `references/spec-driven-development.md`.

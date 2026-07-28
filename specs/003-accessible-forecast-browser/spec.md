# Feature Specification: Accessible Forecast Browser

**Feature Branch**: `003-accessible-forecast-browser`

**Created**: 2026-07-27

**Status**: Implemented

**Input**: User description: "accessible forecast browser: search and browse seeded cities, view
current conditions and hourly/daily forecast with a WCAG 2.2 AA compliant React SPA"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a city (Priority: P1)

A visitor opens the site and sees the list of available cities. They can type to filter the list
by city or region name and follow a link to any city's forecast.

**Why this priority**: The entry point to every other capability; without it nothing else is
reachable.

**Independent Test**: Load `/`, confirm every seeded city is listed with its region, type a
partial name into the search field, and confirm the list narrows to matching cities only.

**Acceptance Scenarios**:

1. **Given** the city list has loaded, **When** the page renders, **Then** every city from
   `GET /api/cities` is listed as a link naming the city and its region.
2. **Given** the list is showing, **When** the visitor types "tok" into the search field,
   **Then** only cities whose name or region matches "tok" (case-insensitive) remain, and the
   result count is announced.
3. **Given** the visitor types text matching no city, **When** the list updates, **Then** a
   "No cities match" message is shown and announced — the page does not appear broken or empty
   without explanation.
4. **Given** the visitor activates a city link, **When** the forecast browser page loads,
   **Then** focus moves to the new page's main content and its heading names the city.

---

### User Story 2 - See a city's current conditions and forecast (Priority: P1)

A visitor on a city's page sees current conditions, when the data was last refreshed, and can
switch between hourly and daily forecast views, each shown as an accessible table.

**Why this priority**: This is the product's core value — everything else exists to get a visitor
here.

**Independent Test**: Load `/cities/:slug` for a city with ingested data; confirm current
conditions, freshness, and both forecast tables (via the Hourly/Daily tabs) render with correct
data and accessible names.

**Acceptance Scenarios**:

1. **Given** a city has an observation, **When** its page loads, **Then** the current temperature,
   a human-readable condition ("Partly cloudy", not a bare code), and "as of" freshness text are
   shown.
2. **Given** a city has no observation yet (worker hasn't completed a first cycle), **When** its
   page loads, **Then** a clear "No current conditions yet" message is shown instead of blank or
   broken UI.
3. **Given** the Hourly tab is active, **When** the visitor switches to the Daily tab (click or
   arrow keys), **Then** the daily forecast table replaces the hourly one and the active tab is
   exposed to assistive technology.
4. **Given** forecast data is loading, **When** the fetch is in flight, **Then** a loading message
   is shown and announced without moving focus.
5. **Given** the forecast fetch fails, **When** the error occurs, **Then** an alert message with a
   retry action is shown; retrying re-fetches without a full page reload.

---

### User Story 3 - Navigate and operate the whole site by keyboard alone (Priority: P1)

A keyboard-only visitor can reach and operate every control — search, city links, tabs, retry
actions — without a mouse, with visible focus at every step, and can bypass repeated
header/navigation content.

**Why this priority**: Not a "nice to have" layered on afterward — constitution Principle I makes
this a first-class requirement of the same feature, not a separate one.

**Independent Test**: Starting from a fresh page load, Tab through the entire page using only the
keyboard and confirm every interactive element is reachable, operable, and visibly focused, with
a working skip link as the first stop.

**Acceptance Scenarios**:

1. **Given** any page loads, **When** the visitor presses Tab once, **Then** a "Skip to main
   content" link receives focus first; activating it moves focus into `<main>`.
2. **Given** the visitor is in the tab list on a city page, **When** they press Left/Right arrow
   keys, **Then** focus and selection move between the Hourly and Daily tabs without leaving the
   tab list.
3. **Given** the visitor navigates from the city list to a city page, **When** the new page
   renders, **Then** focus is already on the new page's main content — the visitor is not left
   focused on a link that no longer exists in view.

### Edge Cases

- What happens when the API is unreachable at all (not just one route failing)? → Same error +
  retry treatment as any other fetch failure; no unhandled promise rejection, no blank page.
- What happens when a city slug in the URL doesn't exist? → A "City not found" message with a link
  back to the city list, not a crash or a silent blank page.
- What happens at a 320 CSS px viewport? → The layout reflows to a single column; the forecast
  table scrolls horizontally within its own container if needed, without the page itself
  requiring two-dimensional scrolling.
- What happens under `forced-colors: active`? → Borders, focus indicators, and the tab
  selected-state remain visible using system colors; nothing relies on a suppressed box-shadow or
  background-color-only cue.
- What happens with `prefers-reduced-motion: reduce`? → Any transition (tab panel change, focus
  movement) is non-essential and is not required to perceive the change; no motion is forced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The SPA MUST render a city list page at `/` listing every city from
  `GET /api/cities`, each as a link to `/cities/:slug`.
- **FR-002**: The city list page MUST provide a search field that filters the visible list by
  case-insensitive substring match against city name or region name, client-side, with no
  additional network request.
- **FR-003**: The city list page MUST announce the current result count (or a "no matches"
  message) through a live region as the visitor types, without moving focus.
- **FR-004**: The SPA MUST render a city detail page at `/cities/:slug` showing: the city name as
  the page heading, current conditions (temperature + human-readable weather label) when present,
  a "no current conditions yet" state when absent, and the freshness timestamp from
  `GET /api/cities/:slug`.
- **FR-005**: The city detail page MUST provide Hourly and Daily forecast views behind a tab
  interface; the Hourly view shows the next 24 hours, the Daily view shows all 7 available days.
- **FR-006**: Each forecast view MUST render its data as an accessible `<table>` with a caption
  naming the city and range, and each row's first cell as a `<th scope="row">`, plus a chart with
  an accessible name of the form "Chart of {city} {range} temperature, data in table below"; the
  table is the sole source of truth for the data — nothing is chart-only.
- **FR-007**: Loading and error states for both pages MUST be communicated via the appropriate
  live region (`status` for loading/progress, `alert` for errors) without moving focus; every
  error state MUST offer a retry action that re-fetches without a full page reload.
- **FR-008**: An unknown city slug MUST render a "City not found" state with a link back to the
  city list, not a crash.
- **FR-009**: Every page MUST provide a "Skip to main content" link as the first focusable
  element, targeting a focusable `<main>`.
- **FR-010**: Navigating between pages (city list → city detail, and back) MUST move focus to the
  new page's `<main>` so screen reader and keyboard users land on new content without manually
  hunting for it.
- **FR-011**: The layout MUST reflow without two-dimensional scrolling at 320 CSS px, except the
  forecast table itself, which may scroll horizontally within its own container.
- **FR-012**: All interactive components MUST come from the project's own accessible component
  library (`packages/ui`, built on React Aria Components) or native HTML elements, per the
  constitution's implementation-priority ladder — no ad hoc custom-ARIA widgets where a native
  element or the library already covers the need.

### Key Entities

No new backend entities — this feature is a read-only consumer of `002-weather-ingestion-worker`'s
API (`GET /api/cities`, `GET /api/cities/:slug`, `GET /api/cities/:slug/forecast`,
`GET /api/meta/freshness`).

## Accessibility

**Affected personas**: screen reader, keyboard-only, low-vision, cognitive, situational (all
directly exercised by this feature — it is the only user-facing surface in the project). Deaf/HoH
and motor/voice/switch are addressed structurally (no audio content; all controls are standard
size, named, and keyboard-operable) but have no feature-specific behavior beyond that.

### components

- **Skip link** — native `<a href="#maincontent">`, first focusable element on every page.
  Native semantics; no library needed (ladder tier 3).
- **Search field** — React Aria Components `SearchField` (component library, ladder tier 2):
  gives a labeled input with a built-in, keyboard-operable clear control and correct
  `type="search"` semantics for free, instead of hand-rolling a clear button.
- **City list** — native `<ul>`/`<li>`/`<a>` (ladder tier 3). Deliberately not a listbox or grid:
  it is a list of navigation links, and `references/navigation.md` explicitly warns against
  `role="listbox"`/`role="menu"` semantics for plain link navigation.
- **Tabs (Hourly/Daily)** — React Aria Components `Tabs`/`TabList`/`Tab`/`TabPanel` (component
  library, ladder tier 2): implements the full WAI-ARIA tablist pattern (roving tabindex, arrow-key
  movement, `aria-selected`/`aria-controls`) without hand-rolling it.
- **Forecast table** — native `<table>`/`<caption>`/`<th scope="col">`/`<th scope="row">` (ladder
  tier 3), per `references/tables-grids.md` — static tabular data, not an interactive grid.
- **Status/alert live regions** — native `role="status"` / `role="alert"` elements (ladder tier
  3/4), rendered once and mutated, per `references/status-messages.md`.
- **Chart** — custom inline SVG, `role="img"` with a short `aria-label` pointing to the table
  (ladder tier 5, justified: no native element covers a trend line; the label is intentionally
  short — a pointer to the real data in the table right next to it, not a restatement of every
  value — per `references/images-graphics.md`'s guidance on complex graphics).
- **Buttons** (retry, clear-search) — React Aria Components `Button` (component library, ladder
  tier 2) or native `<button>` where React Aria's Button is not already in use on that control.

### labels

| Element | Accessible name |
|---|---|
| Skip link | "Skip to main content" |
| Search field | "Search cities" (visible `<Label>`) |
| Each city list link | "`<City name>`, `<Region name>`" |
| Hourly tab | "Hourly" (visible text = accessible name) |
| Daily tab | "Daily" (visible text = accessible name) |
| Forecast table | Named by its `<caption>`: "`<City name>` hourly forecast" / "`<City name>` daily forecast" |
| Retry button (list error) | "Retry loading cities" |
| Retry button (detail error) | "Retry loading forecast" |
| "Back to city list" link (not-found state) | "Back to city list" |

City list links always include the region so same-named cities in different regions remain
distinguishable (e.g. two cities both named "Springfield").

### grouping

No fieldset/legend grouping in this feature — the only form control is a single, independently
labeled search field. Tabs are grouped by the `Tabs` component's own container semantics
(`role="tablist"`), not a fieldset.

### keyboard

- Tab order: skip link → header brand link → search field (+ its built-in clear button when
  populated) → each city link, top to bottom (list page); skip link → tab list (Hourly, then
  Daily) → forecast table's focusable content, if any → footer attribution link (detail page).
- Search field: type to filter; the clear button (Enter/Space or click) empties the field and
  returns focus to the input.
- Tabs: one sequential tab stop on the active tab; Left/Right arrow keys move between Hourly and
  Daily and activate the newly-focused tab (roving tabindex, per `references/keyboard-focus.md`).
- City link activation and "Back to city list" navigate via the router; focus moves to the
  destination page's `<main>` (see Dynamic state below) — no separate Escape/Enter handling needed
  beyond the browser/router default for links.
- No modal overlays exist in this feature, so no focus trap is required anywhere.

### dynamic_state

- `aria-selected` / `aria-controls` / `tabindex` on Hourly/Daily tabs — updated by the `Tabs`
  component automatically on selection change; no manual ARIA management needed.
- `aria-current="page"` is not applicable (no persistent nav with a "current section" concept in
  this two-page app).
- Loading state: content area shows a `role="status"` message ("Loading cities…" /
  "Loading forecast…") while a request is in flight; cleared (text emptied, region stays in DOM)
  once data or an error state renders.

### status_messages

| Region | Politeness | Template | Trigger |
|---|---|---|---|
| `#city-list-status` | `status` (polite) | "Loading cities…" | City list fetch starts |
| `#city-list-status` | `status` (polite) | "`<n>` cities" / "`<n>` cities matching \"`<query>`\"" | Filtered list count changes (debounced) |
| `#city-list-status` | `status` (polite) | "No cities match \"`<query>`\"." | Filter yields zero results |
| `#city-list-error` | `alert` (assertive) | "Couldn't load cities. Retry loading cities." | City list fetch fails |
| `#city-detail-status` | `status` (polite) | "Loading forecast…" | City detail/forecast fetch starts |
| `#city-detail-error` | `alert` (assertive) | "Couldn't load forecast for `<city>`. Retry loading forecast." | City detail/forecast fetch fails |

### testing

- Component-level: Vitest + Testing Library + `vitest-axe` for every component in `packages/ui`
  and every page in `packages/web`, asserting role/name/state and zero axe violations on render
  (including an open-tab and a filtered-list-with-results render state, not just the default).
- End-to-end: Playwright + `@axe-core/playwright`, per page (`/`, `/cities/:slug`, unknown slug):
  full-page axe scan, a keyboard-only journey (skip link → search → city link → tab switch →
  forecast table), a 320 CSS px viewport reflow check, and a `forced-colors: active` pass. Test
  files: `e2e/city-list.spec.ts`, `e2e/city-detail.spec.ts`, `e2e/keyboard-navigation.spec.ts`.

### known_limitations

- Client-side search is exact-substring, not fuzzy or typo-tolerant — a low-vision or cognitive
  user who mistypes a city name gets "no matches" rather than a suggested correction.
- The decorative chart's visual trend (e.g., "warms through the afternoon") is not separately
  summarized in prose; a screen reader user gets the same numbers as a sighted user via the table,
  but not an at-a-glance trend description either user gets from glancing at the chart shape —
  low-vision/cognitive persona.
- The Hourly table is capped at the next 24 hours in this iteration; the API has up to 168 hours
  available, not currently reachable through the UI (only via the API directly) — no persona
  impact beyond reduced scope.
- No offline / service-worker support; a situational user with a flaky connection sees the same
  error/retry treatment as any other fetch failure, not an offline-specific message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every seeded city is reachable from `/` to its `/cities/:slug` page within two
  interactions (locate link, activate it) with no search required.
- **SC-002**: A keyboard-only user can reach and operate every interactive control on both pages
  (verified by the Playwright keyboard-only journey test) with zero unreachable controls.
- **SC-003**: Automated axe scans (component-level and full-page e2e) report zero violations rated
  `serious` or `critical` on every page and every rendered state exercised by the test suite.
- **SC-004**: The full page reflows with no horizontal scroll at 320 CSS px, except the forecast
  table's own scroll container (verified by the Playwright reflow test).
- **SC-005**: `forced-colors: active` leaves every focus indicator and the active-tab indicator
  visibly distinguishable (verified by the Playwright forced-colors pass).

## Assumptions

- "Next 24 hours" for the Hourly view and "all 7 days" for the Daily view is a scope decision for
  this iteration, not a product requirement — recorded above under known_limitations.
- No authentication or personalization exists anywhere in this project; every page is fully public,
  matching the constitution's read-only public surface.
- Chart rendering uses no third-party charting library — a minimal inline SVG is sufficient for a
  decorative supplement to the always-visible accessible table, keeping the dependency surface
  small.
- Browser support target is evergreen browsers (no IE11 or legacy-Edge accommodation).

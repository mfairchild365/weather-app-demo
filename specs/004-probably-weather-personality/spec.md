# Feature Specification: Probably Weather — Personality Pass

**Feature Branch**: `004-probably-weather-personality`

**Created**: 2026-07-28

**Status**: Implemented

**Input**: User description: "give the project some personality — make it quirky and fun"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the site in its own voice (Priority: P1)

A visitor sees a consistent, dry, understated voice across every page — heading, loading text,
error text, empty states, the 404 page, and the footer — instead of the generic literal
"weather-demo" placeholder copy that shipped in `003-accessible-forecast-browser`.

**Why this priority**: Voice is the cheapest, lowest-risk layer and the one every other layer
depends on for naming consistency (page titles, OpenAPI title, README).

**Independent Test**: Load `/`, `/cities/:slug`, and an unknown path; confirm every visible string
matches the new copy table in this spec's `status_messages` and `labels` sections, and that every
plain-language meaning ("couldn't load", "loading", "not found") is still present alongside the
wry phrasing.

**Acceptance Scenarios**:

1. **Given** the city list is loading, **When** the page renders, **Then** the status region reads
   "Consulting the sky…" (spec 003's "Loading cities…" is retired).
2. **Given** the city list fetch fails, **When** the error renders, **Then** the alert reads "The
   sky is not returning our calls. Couldn't load cities." — the plain-language fact ("couldn't
   load cities") is still literally present, not replaced by the joke.
3. **Given** a visitor loads an unknown path, **When** the 404 page renders, **Then** the heading
   and body use the new deadpan copy while the "Back to city list" link keeps its exact
   accessible name from spec 003.
4. **Given** any page loads, **When** the document title is inspected, **Then** it reads "Probably
   Weather" (list/404) or "`<City>` forecast — Probably Weather" (detail), replacing every
   `weather-demo` occurrence.

---

### User Story 2 - See the forecast dressed with icons, a mascot, and a distinct look (Priority: P1)

A visitor sees a weather icon next to every condition (current conditions and every forecast
table row), a small decorative mascot in the header, a favicon in the browser tab, a display
typeface on headings, and a muted teal accent color in place of the generic blue — all while every
existing contrast, focus, and reflow guarantee from `003` continues to hold.

**Why this priority**: This is the visual payoff of the pass and the one most visible to a
first-time visitor; it also finally uses `weatherIconKey`, which has been served by the API and
ignored by the UI since `002`.

**Independent Test**: Load `/cities/:slug` for a city with an observation and confirm an icon
renders next to current conditions and next to each forecast table row's condition text; confirm
the tab title shows a favicon; confirm headings render in the display typeface with a system-font
fallback if the font fails to load; run the Playwright `forced-colors: active` and 320px reflow
checks against the new visuals and confirm they still pass.

**Acceptance Scenarios**:

1. **Given** a city has a current observation, **When** its page renders, **Then** a decorative
   icon matching `weatherIconKey` renders beside the existing `weatherLabel` text — the label
   remains the sole accessible source of the condition; the icon adds nothing to the accessible
   name.
2. **Given** any of the 14 seeded `weatherIconKey` values (or an unrecognized one) appears in
   forecast or observation data, **When** it renders, **Then** a matching icon (or a neutral
   fallback icon) is shown — no value causes a missing or broken image.
3. **Given** the page is viewed under `forced-colors: active`, **When** icons, the mascot, and the
   recolored focus/link states render, **Then** every non-decorative state (focus ring, link,
   active tab) remains distinguishable using system colors, per `references/contrast-forced-colors.md`.
4. **Given** the display font fails to load (blocked, slow network), **When** the page renders,
   **Then** headings fall back to a system serif/sans stack with no invisible-text flash
   (`font-display: swap`), and no layout breaks.
5. **Given** the viewport is 320 CSS px wide, **When** the page renders, **Then** the new icons and
   mascot do not introduce horizontal scrolling of the page itself (only the forecast table's own
   scroll container, unchanged from spec 003).

---

### User Story 3 - Get a dry one-line verdict on current conditions (Priority: P2)

A visitor on a city's page sees one additional deterministic line of commentary under the current
conditions — e.g. "4°C. Raining. You knew this already." — and, as a small aside, typing certain
joke strings into the city search returns a dry line instead of the generic "no matches" message.

**Why this priority**: Additive delight layered on top of P1 content that already fully conveys
the data without it; safe to ship after the voice and visual layers are solid.

**Independent Test**: Load a city with a known temperature/condition/day-or-night combination and
confirm the verdict line is deterministic (same inputs → same line, across reloads); confirm it is
plain content, not a live region; type "xyzzy" and "atlantis" into the city search and confirm the
existing `#city-list-status` region announces the joke line instead of the generic "no cities
match" message.

**Acceptance Scenarios**:

1. **Given** a city has a current observation, **When** its page renders, **Then** a single
   `<p>` below the weather label shows a verdict line derived deterministically from temperature,
   `weatherIconKey`, and `isDay` — the same three inputs always produce the same line.
2. **Given** the verdict line is present, **When** a screen reader user has already heard the
   temperature and label announced, **Then** the verdict line is not itself pushed via a live
   region — it is ordinary static content read in document order, not an interruption.
3. **Given** a visitor types "xyzzy" into city search, **When** the list updates, **Then**
   `#city-list-status` announces "Nothing here. You knew that." in place of the generic
   "No cities match" template.
4. **Given** a visitor types "atlantis" into city search, **When** the list updates, **Then**
   `#city-list-status` announces "Submerged. Forecast unavailable."

### Edge Cases

- What happens when `latestObservation` is null? → The existing "No current conditions yet." state
  (spec 003 FR-004) renders exactly as before; no verdict line, no icon, since there is no
  condition to derive either from.
- What happens when `weatherIconKey` doesn't match any of the 14 known keys (a future WMO code
  added to the seed data without a matching icon)? → The fallback icon renders; this MUST NOT throw
  or leave a broken `<img>`/empty node that shifts layout.
- What happens under `prefers-reduced-motion: reduce`? → No-op — this feature introduces zero
  animation or transition (out of scope by design; see Assumptions).
- What happens under `prefers-color-scheme: dark`? → The new `--color-accent`/`--color-link`/
  `--color-focus` dark-mode values apply exactly as `--color-link`/`--color-focus` did in spec
  003 — same mechanism, new hex values, contrast re-verified (see `labels`/testing below).
- What happens if a visitor searches "XYZZY" (different case) or with surrounding whitespace? →
  Matches case-insensitively and trimmed, consistent with spec 003 FR-002's existing matching
  rules for ordinary queries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every user-facing string introduced by `003-accessible-forecast-browser` (headings,
  loading/error/empty-state text, document titles, footer, 404 page) MUST be replaced by the
  deadpan-forecaster copy defined in this spec's `status_messages`/`labels` tables, centralized in
  one module (`packages/web/src/copy.ts`) rather than re-duplicated per component.
- **FR-002**: Every replacement string MUST retain its plain-language factual content (what
  happened / what to do) alongside the wry phrasing — accessible names for controls (buttons,
  links, form fields) MUST remain exactly as specified in spec 003's `labels` table; only
  non-name copy (headings, body text, status/alert message text) changes.
- **FR-003**: The product name MUST change to "Probably Weather" in every product-facing surface:
  header brand link, document titles, `packages/api`'s OpenAPI title/description, and the README
  — excluding internal-only identifiers (npm workspace names, Docker service names, directory
  names, DB identifiers), which are out of scope (see Assumptions).
- **FR-004**: The SPA MUST render a weather icon for every place `weatherLabel` is currently shown
  (current conditions, each forecast table row), mapped from `weatherIconKey`; an unrecognized key
  MUST render a defined fallback icon, never a broken or missing image.
- **FR-005**: Every new icon and the new mascot MUST be `aria-hidden="true"` and MUST NOT be the
  sole carrier of any information — the existing text (`weatherLabel`, city/temperature text)
  remains the accessible source of truth, unchanged from spec 003 FR-004/FR-006.
- **FR-006**: The design token file (`packages/ui/src/tokens.css`) MUST introduce `--color-accent`
  and updated `--color-link`/`--color-focus` values meeting the same contrast thresholds spec 003
  established (body/link text ≥ 4.5:1, focus indicator ≥ 3:1) in both light and default
  (`prefers-color-scheme: dark`) themes, verified by an updated `tokens.test.ts`, not eyeballed.
- **FR-007**: A self-hosted display typeface MUST be added for headings and the brand only (body
  text keeps the existing system stack), using `font-display: swap` and a system-font fallback in
  the same `font-family` declaration, so a blocked or slow font request never produces invisible
  text or a layout shift beyond ordinary font-metric differences.
- **FR-008**: `packages/web/index.html` MUST gain a favicon (`<link rel="icon">`) and a
  `<meta name="description">`, both currently absent.
- **FR-009**: The city detail page MUST render one additional deterministic line of commentary
  ("the verdict") below current conditions when an observation is present, computed by a pure
  function of temperature, `weatherIconKey`, and `isDay` with no randomness — identical inputs
  MUST always produce identical output, and it MUST render as ordinary static content, not inside
  a `role="status"`/`role="alert"` live region.
- **FR-010**: The city list search MUST recognize the literal (case-insensitive, trimmed) queries
  "xyzzy" and "atlantis" and announce a fixed joke line through the existing `#city-list-status`
  region in place of the generic "no cities match" template; all other query behavior (FR-002 of
  spec 003) is unchanged.
- **FR-011**: This feature MUST introduce zero animation, transition, or `prefers-reduced-motion`
  surface — out of scope by design (see Assumptions); the codebase's current zero-animation state
  is preserved.

### Key Entities

No new backend entities or endpoints. This feature is presentation-only: it consumes
`weatherIconKey`, `temperature`, and `isDay`, all already present on `Observation`,
`ForecastHourlyRow`, and `ForecastDailyRow` in `packages/web/src/lib/api-client.ts` (served by
`002-weather-ingestion-worker`'s API, unchanged).

## Accessibility

**Affected personas**: screen reader, keyboard-only, low-vision, cognitive, situational — same set
as spec 003, since this feature only re-skins and re-voices that surface. Deaf/HoH and
motor/voice/switch: no feature-specific behavior (no audio, no new interactive controls beyond the
existing search field).

### components

- **Weather icon** — new `packages/ui/src/WeatherIcon.tsx`, custom inline SVG, `aria-hidden="true"`
  (ladder tier 5, justified exactly as spec 003's `SparklineChart` was: purely decorative,
  always paired with the pre-existing accessible `weatherLabel` text right next to it).
- **Mascot** — new `packages/ui/src/Mascot.tsx`, custom inline SVG, `aria-hidden="true"` (ladder
  tier 5, justified: decorative brand mark beside the header's text brand link, which already
  carries the accessible name).
- **Verdict line** — plain `<p>` (native semantics, ladder tier 3) — ordinary static text, not a
  new widget or live region.
- **Easter-egg copy** — reuses spec 003's existing `StatusMessage` (`packages/ui/src/StatusMessage.tsx`)
  component and `#city-list-status` region; no new component.
- No new form controls, tables, or tab widgets — every existing component from spec 003 is reused
  as-is (implementation-priority ladder tier 1: existing codebase component).

### labels

Accessible names unchanged from spec 003's `labels` table for every control (search field, tabs,
retry buttons, "Back to city list" link, forecast table captions). New body copy (not accessible
names) introduced by this feature:

| Surface | Old (spec 003) | New |
|---|---|---|
| Brand / list heading | "weather-demo" / "Weather forecasts" | "Probably Weather" |
| List loading | "Loading cities…" | "Consulting the sky…" |
| List error | "Couldn't load cities." | "The sky is not returning our calls. Couldn't load cities." |
| List no-matches | `No cities match "<q>".` | `Nothing matched "<q>". Bold search. Zero results.` |
| Detail heading | `<City> forecast` | `<City> forecast` (unchanged — already city-specific) |
| Detail loading | "Loading forecast…" | "Consulting the sky…" |
| Detail error | `Couldn't load forecast for <city>.` | `The sky is not returning our calls. Couldn't load forecast for <city>.` |
| City not found | "City not found" / "We couldn't find a city at this address." | "City not found" / "This page does not exist. The weather here is unknown." |
| 404 page | "Page not found" / "The page you're looking for doesn't exist." | "This page does not exist. The weather here is unknown." |
| Footer | "Weather data by Open-Meteo, licensed CC BY 4.0." | "Data from Open-Meteo. They do the hard part." (link text and href unchanged) |
| No observation | "No current conditions yet." | "No current conditions yet." (unchanged — already plain and clear) |

Icon and mascot: no accessible name (both `aria-hidden`, per FR-005).

### grouping

No change from spec 003 — no new form controls or grouped fields.

### keyboard

No change from spec 003's tab order or interaction model — this feature adds no new interactive
elements. The verdict line and easter-egg copy are reached exactly as the content around them
already was (read in document order / via the existing live region).

### dynamic_state

No change from spec 003. The verdict line updates only when `CurrentConditions` re-renders with a
new observation (navigation or retry) — same lifecycle as the existing temperature/label text
beside it, no independent state machine.

### status_messages

Restates spec 003's table in full with this feature's new templates (supersedes it; spec 003's
file is left as the historical record of what shipped in that iteration):

| Region | Politeness | Template | Trigger |
|---|---|---|---|
| `#city-list-status` | `status` (polite) | "Consulting the sky…" | City list fetch starts |
| `#city-list-status` | `status` (polite) | "`<n>` cities" / "`<n>` cities matching \"`<query>`\"" | Filtered list count changes (debounced) — unchanged template |
| `#city-list-status` | `status` (polite) | `Nothing matched "<query>". Bold search. Zero results.` | Filter yields zero results (query not "xyzzy"/"atlantis") |
| `#city-list-status` | `status` (polite) | "Nothing here. You knew that." | Query is "xyzzy" (case-insensitive, trimmed) |
| `#city-list-status` | `status` (polite) | "Submerged. Forecast unavailable." | Query is "atlantis" (case-insensitive, trimmed) |
| `#city-list-error` | `alert` (assertive) | "The sky is not returning our calls. Couldn't load cities." | City list fetch fails |
| `#city-detail-status` | `status` (polite) | "Consulting the sky…" | City detail/forecast fetch starts |
| `#city-detail-error` | `alert` (assertive) | `The sky is not returning our calls. Couldn't load forecast for <city>.` | City detail/forecast fetch fails |

### testing

- Component-level: `packages/ui/src/WeatherIcon.test.tsx` and `Mascot.test.tsx` assert
  `aria-hidden="true"` and zero axe violations (mirroring `SparklineChart.test.tsx`'s pattern), and
  assert every one of the 14 seeded `iconKey` values plus one unrecognized value each render
  without throwing. `packages/web/src/lib/verdict.test.ts` asserts determinism (same inputs → same
  output) across a representative band matrix (hot/mild/cold × clear/rain/snow/storm ×
  day/night) and asserts the function never throws for any of the 14 seeded keys.
- Every existing `packages/web` page/component test updated to assert the new copy via the shared
  `copy.ts` module (no re-duplicated string literals) and re-run for zero axe violations, exactly
  as spec 003 required.
- End-to-end: existing `e2e/city-list.spec.ts`, `e2e/city-detail.spec.ts`, and
  `e2e/keyboard-navigation.spec.ts` are re-run unmodified in behavior (selectors are role/name
  based, not copy based, so they should not need text-literal updates) plus a re-run of the
  320px-reflow and `forced-colors: active` checks against the new visuals — this is the
  highest-risk regression surface for this feature (new SVGs, recolored tokens, new font).

### known_limitations

- **Deadpan/ironic copy can be misread** by some cognitive and neurodivergent users, and by
  non-native English readers, who may take a wry line ("You knew this already") literally or find
  it unclear rather than funny. Mitigated, not eliminated: every joke line keeps the literal data
  (temperature, condition, "couldn't load") directly adjacent or already stated in the surrounding
  text, so no information is ever *only* available via the joke.
- The verdict line is not exposed to screen reader users any differently than sighted users (both
  get the same static text in document order) — this is intentional (see Acceptance Scenario
  US3.2) but means a screen reader user hears one more sentence per page than a low-vision user
  skimming past it visually might.
- Icon-to-condition mapping (`WeatherIcon.tsx`) is a fixed 1:1 table; a future new `iconKey` value
  in `weather_codes` not yet in this table falls back to the neutral icon rather than a
  more-specific one until this file is updated — carried over from spec 003's pattern of the UI
  needing manual updates when the seed data grows (no dynamic icon generation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero occurrences of the literal string "weather-demo" remain in any product-facing
  UI surface (page titles, header, footer, 404/not-found copy) or in the OpenAPI document's
  title/description.
- **SC-002**: An icon (a known-key icon or the fallback) renders for 100% of the 14 seeded
  `weatherIconKey` values plus at least one unrecognized value, with zero thrown errors or broken
  image nodes (verified by `WeatherIcon.test.tsx`).
- **SC-003**: Automated axe scans (component-level and full-page e2e, per spec 003's existing
  suite) continue to report zero violations rated `serious` or `critical` on every page and every
  rendered state, after this feature's visual and copy changes.
- **SC-004**: `tokens.test.ts` reports every new/changed color pair meeting its WCAG 2.2 AA
  threshold (≥4.5:1 text, ≥3:1 non-text focus indicator) in both light and dark themes — computed,
  not eyeballed, exactly as spec 003 required.
- **SC-005**: The Playwright 320px reflow and `forced-colors: active` checks continue to pass
  unmodified against the new visuals (SC-004/SC-005 from spec 003, re-verified here).
- **SC-006**: `getVerdict()` is a pure function — calling it twice with identical arguments in the
  same or a different process always returns the identical string (verified by
  `verdict.test.ts`).

## Assumptions

- Only product-facing names change (header brand, page titles, OpenAPI doc, README heading).
  Internal-only identifiers — npm workspace names (`@weather-demo/ui`, `@weather-demo/web`), the
  repository directory name, Docker Compose service names, and database identifiers — are
  unchanged. Renaming these would touch every import path and compose file for no user-visible
  benefit and is out of scope for this spec.
- Motion/animation is explicitly out of scope. The codebase has zero animation or
  `prefers-reduced-motion` handling today (confirmed absent in spec 003's implementation); adding
  any would require new motion tokens and a reduced-motion contract this spec does not attempt to
  write. A future spec can add motion deliberately if desired.
- The display typeface (self-hosted `.woff2`, SIL Open Font License) is scoped to headings and the
  brand link only — body text, table content, and form fields keep the existing system-font stack
  from spec 003 unchanged, so reading-heavy surfaces (the forecast table) are unaffected by the
  font choice.
- No third-party icon library is introduced — inline SVG, matching spec 003's `SparklineChart`
  precedent of a minimal hand-authored decorative asset over adding a dependency.
- The two easter-egg queries ("xyzzy", "atlantis") are copy-only and reuse the existing
  `#city-list-status` live region and existing search/filter mechanics from spec 003 FR-002/FR-003
  — no new interactive surface, so no new keyboard or focus contract is required.

# Feature Specification: Visitor Context Layer — Pinned Home City

**Feature Branch**: `006-visitor-context`

**Created**: 2026-07-30

**Status**: Implemented

**Input**: User description: "Client-only visitor context layer: remember a pinned home city across
visits via localStorage, surfaced through a React provider and a header link, with a
forget-my-preferences control"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pin a home city and have it survive a reload (Priority: P1)

A returning visitor has a city they check more than any other. Today every visit starts from zero —
the city list is unordered and nothing about a prior visit is remembered. This story lets a visitor
mark one city as "home" from its detail page; the pin is stored in the browser and comes back on the
next visit, even after closing the tab.

**Why this priority**: This is the entire value of the feature — without persistence there is
nothing to build a header link or list ordering on top of.

**Independent Test**: From a city's detail page, activate the "Home city" toggle. Reload the page.
The toggle is still pressed. Close and reopen the browser tab to the same URL; still pressed.

**Acceptance Scenarios**:

1. **Given** a visitor is on `/cities/tokyo-jp` with no home city set, **When** they activate the
   "Home city" toggle, **Then** it becomes pressed, a confirmation is announced, and the choice is
   written to `localStorage`.
2. **Given** a visitor has pinned Tokyo, **When** they reload the page or return in a new session,
   **Then** the toggle on `/cities/tokyo-jp` is still pressed and no other city's toggle is.
3. **Given** a visitor has pinned Tokyo, **When** they activate the toggle again, **Then** it becomes
   unpressed, a different confirmation is announced, and the stored value is cleared.
4. **Given** a visitor's browser blocks `localStorage` (e.g. Safari Private Browsing with storage
   denied), **When** they pin a city, **Then** the toggle still works for the remainder of the tab's
   session, and a message tells them the choice will not survive closing the tab.

---

### User Story 2 - See and reach the pinned city from anywhere (Priority: P2)

Once a city is pinned, a visitor should not have to search or navigate back to it. A link to it
appears in the page header, on every page, and the city list surfaces it first.

**Why this priority**: This is what makes the pin useful day to day, but it has no meaning without
Story 1's persistence.

**Independent Test**: With a city pinned, load `/` and `/cities/<other-slug>`. Confirm the header
shows a link to the pinned city on both, and that the city list shows the pinned city first with a
"(home city)" marker in its link text.

**Acceptance Scenarios**:

1. **Given** a home city is pinned, **When** a visitor loads any page, **Then** the header shows a
   link reading "Home: `<City>, <Region>`" that navigates to that city's detail page.
2. **Given** a visitor is already on the pinned city's own detail page, **When** the header renders,
   **Then** the home-city link carries `aria-current="page"` and no navigation is offered to the page
   the visitor is already on.
3. **Given** a home city is pinned, **When** a visitor loads `/`, **Then** that city appears first in
   the list, and its link text includes "(home city)".
4. **Given** a home city is pinned and excluded by an active search query, **When** the visitor is
   viewing filtered results, **Then** the pinned city does **not** reappear outside the filtered set —
   the search filter takes precedence over the pin.

---

### User Story 3 - Forget saved preferences (Priority: P3)

A visitor who pinned a city, is on a shared or public computer, or simply changes their mind can
clear everything the app has remembered about them in one action, from the same header where the
preference is visible.

**Why this priority**: A privacy/reset affordance is expected alongside any client-side persistence,
but it is meaningful only once Story 1 has something to forget.

**Independent Test**: With a city pinned, activate "Forget my saved preferences" in the header.
Confirm the pin is cleared, the header link disappears, and `localStorage` no longer contains the
visitor-context key. Activate the same control with nothing pinned; confirm it gives feedback rather
than doing nothing silently.

**Acceptance Scenarios**:

1. **Given** a home city is pinned, **When** the visitor activates "Forget my saved preferences",
   **Then** the pin is cleared, the header home-city link disappears, a confirmation is announced,
   and focus remains on the button that was just pressed.
2. **Given** nothing is pinned, **When** the visitor activates "Forget my saved preferences",
   **Then** nothing changes and a message says there was nothing to forget — the control never fails
   silently.

### Edge Cases

- What happens when the pinned city is renamed on the server between visits? → The cached display
  name is used until the visitor next opens the city list or that city's detail page, at which point
  it silently reconciles to the fresh name. Never announced — the visitor did not act.
- What happens when the pinned city no longer exists (its detail request returns 404)? → The pin is
  cleared automatically and an announcement explains why. A transient failure (network error, 500) is
  explicitly **not** treated as "gone" — it must not destroy a saved preference.
- What happens when the same visitor has two tabs open, one of which changes the pin? → The other tab
  picks up the change via a `storage` event and updates its header/list silently — no announcement,
  since the action did not happen in that tab.
- What happens under React `<StrictMode>` (dev double-invoked effects)? → Hydration reads storage in
  a lazy `useState` initializer (a pure read, safe to double-invoke); all writes happen only inside
  user-triggered action callbacks, which StrictMode does not double-invoke.
- What happens if `localStorage` throws on write (quota exceeded) after a successful read? → The
  value is kept in memory for the rest of the tab's session and `durable: false` is reported, which
  triggers the not-persisted announcement.
- What happens to an unpinned toggle's accessible name vs. a pinned one? → Identical visible label
  ("Home city") in both states; only `aria-pressed` changes. The name must never encode state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST persist at most one pinned home city (`slug`, `name`, `regionName`)
  entirely client-side, in `localStorage` under a single namespaced, versioned key, with no request
  to any server endpoint. No new API route, database table, or write-scoped credential is introduced
  (Constitution Principle III).
- **FR-002**: A `VisitorContextProvider`, mounted once in `packages/web/src/main.tsx`, MUST be the
  single source of truth for the pinned home city on the client; components read and write it only
  through `useVisitorContext()`, never by touching `localStorage` directly.
- **FR-003**: Reading a malformed, foreign-shaped, or version-mismatched stored value MUST fall back
  to an empty default without throwing, so a corrupted or hand-edited value cannot break the app.
- **FR-004**: When `localStorage` is unavailable, disabled, or throws on write, the pin MUST continue
  to work in memory for the current tab, and the visitor MUST be told (once, at the point of the
  first failed write) that it will not survive closing the tab.
- **FR-005**: A "Home city" toggle on the city detail page MUST let a visitor pin or unpin the city
  currently being viewed. Its visible label MUST NOT change between pressed and unpressed states;
  state is conveyed by `aria-pressed` and a non-color visual cue.
- **FR-006**: A header link to the pinned city MUST appear on every page once a city is pinned, and
  MUST NOT appear when nothing is pinned. It MUST carry `aria-current="page"` when the visitor is
  already on that city's page.
- **FR-007**: The city list page MUST place the pinned city first among the currently filtered
  results (never reintroducing it if a search query excludes it) and MUST mark it in the link's
  visible text, not by position alone.
- **FR-008**: An always-present, always-enabled "Forget my saved preferences" control MUST appear in
  the header. Activating it MUST clear all stored visitor-context data, announce the result
  (distinguishing "something was cleared" from "there was nothing to clear"), and MUST NOT move focus
  away from the control.
- **FR-009**: If the detail request for the currently pinned city's slug returns HTTP 404, the pin
  MUST be cleared automatically and the visitor MUST be told why. Any other failure (network error,
  5xx) MUST leave the pin untouched.
- **FR-010**: A stale cached display name for the pinned city MUST silently correct itself the next
  time fresh data for that city is loaded (city list or that city's detail page), without an
  announcement.
- **FR-011**: A change to the pinned city made in one browser tab MUST be reflected in the header and
  list of any other open tab of the app, without an announcement in the tab that did not perform the
  action.
- **FR-012**: All new user-facing confirmations MUST route through the existing shared announcer
  (`packages/ui/src/announcer.ts`, spec 005) — no new live region is introduced.

### Key Entities

No new backend entities, endpoints, or database schema. This feature adds one client-side,
browser-persisted value:

- **Visitor context**: `{ version: 1, homeCity: { slug, name, regionName } | null }`, stored under
  the key `probably-weather:visitor-context` in `localStorage`. Not associated with any account or
  server-side identity — scoped to one browser profile on one device.

## Accessibility

**Affected personas**: all seven. Screen reader (two new controls, one new conditional link, six new
announcements, one new `aria-pressed` state); keyboard-only (two new tab stops in the header, one of
them conditional); low-vision (non-color state cues on the toggle, stable header layout when the
link appears/disappears); cognitive (state-neutral toggle label, explicit feedback on the no-op
"nothing to forget" case, plain first-person copy); motor/voice/switch (all controls named and
keyboard-operable, no confirmation dialog to navigate for the reversible forget action); situational
(the cached display name avoids an extra network round-trip on every page load); deaf/HoH (no audio
content anywhere — unaffected).

### components

- **Home-city toggle** (city detail page) — new `packages/ui/src/ToggleButton.tsx`, wrapping React
  Aria Components' `ToggleButton` (ladder **tier 2**: component library). `aria-pressed`, Enter/Space
  activation, and focus handling come from the library; this wrapper adds tokenized styling and
  constructs the accessible name from a state-neutral `label` plus a `qualifier`, so name-label match
  (WCAG 2.5.3) holds structurally rather than by convention.
- **Header home-city link** — new `packages/web/src/components/HomeCityLink.tsx`. Native `<a>` via
  the existing `react-router-dom` `Link`, plus `aria-current="page"` (ladder **tier 4**: native
  element + minimal ARIA). No new landmark — it renders inline in the existing `<header>`.
- **Forget-preferences control** — new `packages/web/src/components/ForgetPreferencesButton.tsx`,
  built on the existing `packages/ui/src/Button.tsx` (ladder **tier 1**: existing codebase
  component).
- **`VisitorContextProvider`** — new `packages/web/src/context/VisitorContextProvider.tsx`. Renders
  no DOM; no accessibility surface of its own.
- **`announce()`** (`packages/ui/src/announcer.ts`, spec 005) — reused unchanged for all six new
  announcements. No new live region.

### labels

| Element | Accessible name | Notes |
|---|---|---|
| Home-city toggle (city detail page) | `"Home city: <City name>, <Region name>"` | Visible label `"Home city"` is always a prefix of the accessible name; the qualifier makes it unique per city. Identical in both pressed states. |
| Header home-city link | `"Home: <City name>, <Region name>"` | Visible text is the accessible name; the decorative star is `aria-hidden`. |
| Forget-preferences button | `"Forget my saved preferences"` | Visible text; state-neutral; first-person, plain language. |
| Pinned city's list link | `"<City name>, <Region name> (home city)"` | The suffix is inside the link, so it is part of the accessible name, not an adjacent orphan. |
| Toggle state glyph (`☆`/`★`) | none | `aria-hidden="true"` — decorative; state lives in `aria-pressed`, not in any name. |

`"Set as home city"` / `"Remove home city"` are explicitly rejected for the toggle's label: a toggle
button's accessible name must not encode its own state (WCAG 4.1.2, WAI-ARIA APG Button pattern).

### grouping

Not applicable. Three independent single controls (toggle, link, button) — no radio/checkbox set, no
`<fieldset>`/`<legend>` needed.

### keyboard

- **Tab order** (supersedes spec 003's tab-order line): skip link → header brand link → header
  home-city link *(present only when a city is pinned)* → "Forget my saved preferences" → `<main>`
  content (list page: search field + its clear button → city links top to bottom; detail page:
  home-city toggle → tab list → forecast table content) → footer attribution links.
- Home-city toggle: one sequential tab stop; **Enter** and **Space** both toggle it (React Aria
  Components default). No arrow-key behavior — it is a standalone toggle, not a composite widget.
- Forget-preferences button: one tab stop; Enter/Space activate; no confirmation step.
- Header home-city link: standard link activation; navigates via the router, after which focus moves
  to the destination page's `<main>` per the existing `useFocusMainOnRouteChange` hook.
- No modal overlays, no focus traps, and no new keyboard shortcuts are introduced anywhere in this
  feature.
- **Load-bearing ordering constraint**: every control that can *remove* a header element is
  positioned **after** that element in DOM order — the forget button follows the home-city link, and
  the pin toggle itself lives in `<main>`, after the entire header. Consequence: no control this
  feature adds can ever destroy its own keyboard focus by removing itself or an earlier element from
  the DOM. Any future reordering of the header MUST preserve this property.

### dynamic_state

| Attribute | Element | Trigger |
|---|---|---|
| `aria-pressed` (`false` ↔ `true`) | Home-city toggle | Visitor activates the toggle; also correct on the very first painted frame (state is hydrated before first paint, not in a post-mount effect) — no visible flip after load. |
| `aria-current="page"` (present/absent) | Header home-city link | The current route matches `/cities/<pinned slug>`. |
| Element present/absent | Header home-city link; list-link `(home city)` suffix | Home city set, cleared, forgotten, auto-cleared on a 404, or changed in another browser tab. |

- The toggle's pressed state is conveyed by **border weight and a glyph swap** (`☆` → `★`) in
  addition to background color — never by color alone, and both cues survive `forced-colors: active`.
- The header reserves its populated height, so the home-city link appearing or disappearing does not
  reflow `<main>` under a control that currently has focus.
- Changes that arrive via a cross-tab `storage` event update the UI **silently** — no announcement,
  because the visitor did not perform the action in the tab receiving the update.

### status_messages

All six routed through the existing shared polite announcer (`[data-announcer="polite"]`, spec 005).
No new live region is introduced, and none of these are `assertive`.

| Politeness | Template | Trigger |
|---|---|---|
| `status` (polite) | `"<City>, <Region> is now your home city. Noted."` | Toggle activated: unpressed → pressed. |
| `status` (polite) | `"<City>, <Region> is no longer your home city."` | Toggle activated: pressed → unpressed. |
| `status` (polite) | `"This browser will not let us store anything. Your home city lasts until you close the tab."` | Queued immediately after a successful in-memory set whose write did not reach durable storage. |
| `status` (polite) | `"Saved preferences forgotten. Clean slate."` | Forget button activated and something was actually stored. |
| `status` (polite) | `"Nothing saved to forget."` | Forget button activated and nothing was stored. |
| `status` (polite) | `"<City> is no longer available. Home city cleared."` | The detail request for the pinned slug returns 404. |

**Deliberate non-messages** (recorded so the omissions read as decisions, not gaps): the pinned
city's list reordering is not announced (the visitor already heard the pin confirmation on the other
page, and the debounced `#city-list-status` count text is unaffected by pin-driven reordering);
cross-tab state changes are not announced; silent display-name reconciliation is not announced.

### testing

- `packages/web/src/lib/visitor-context-store.test.ts` (vitest **node** project, injected fake
  storage): defaults, round-trip, malformed JSON, version mismatch, foreign shape, partial/garbage
  `homeCity`, `getItem`/`setItem` throwing, in-memory continuity after a failed write, `null`
  storage, reset.
- `packages/web/src/context/VisitorContextProvider.test.tsx` (vitest **dom**): hook throws outside
  the provider; hydration happens on first render (not in an effect); `<StrictMode>` produces zero
  storage writes on mount and exactly one per user action; cross-tab `storage` events are applied,
  validated, and ignored when the key doesn't match.
- `packages/ui/src/ToggleButton.test.tsx` (vitest **dom**): accessible name equals `"<label>:
  <qualifier>"` and contains the visible label verbatim (explicit assertion — axe's
  `label-content-name-mismatch` rule is experimental and not run by this project's axe config, so
  this must be asserted directly, not assumed from a passing axe scan); label text identical across
  both pressed states; `aria-pressed` flips on click, Enter, and Space; axe-clean pressed and
  unpressed.
- `packages/web/src/components/HomeCityLink.test.tsx` / `ForgetPreferencesButton.test.tsx` (vitest
  **dom**): presence/absence logic, `aria-current`, focus retention after activation, correct
  announcement per case, axe-clean.
- `packages/web/src/routes/CityDetailPage.test.tsx` and `CityListPage.test.tsx` (extended): toggle
  state and persistence, 404 auto-clear, pinned-first ordering with the filter taking precedence,
  `(home city)` suffix in the accessible name, axe-clean with a city pinned.
- `packages/web/src/App.test.tsx` (extended): header link present/absent, exactly zero `navigation`
  landmarks (guards against an unnamed `<nav>` being added later), axe-clean with a city pinned.
- `packages/ui/src/tokens.test.ts` (extended): add the `--color-surface` / `--color-text` contrast
  pair used by the toggle's pressed style — not currently asserted despite being defined in
  `tokens.css` and already used by `Button.tsx`'s secondary variant.
- `e2e/visitor-context.spec.ts` (new, Playwright + `@axe-core/playwright`): pin survives a real
  `page.reload()` (the test that actually proves storage rather than in-memory React state); pinned
  city first in the list with the filter still winning; `aria-current` correctness; forget-keeps-focus;
  a full keyboard-only walk of the new tab stops; axe on every new state; 320px reflow with the
  header populated. `e2e/keyboard-navigation.spec.ts` requires no change — it never pins a city, so
  its existing tab sequence (skip link → brand → the always-present forget button) is unaffected.
- Constitution Principle II: every test above must be executed and passing against the exact
  artifact submitted, not merely written — re-run the full suite after any post-test edit.

### known_limitations

- **Stale display name.** The pinned city's name/region are cached in `localStorage` so the header
  can render without a network request on every page. If the city is renamed server-side, the header
  and list show the old name until the visitor next opens the city list or that city's detail page,
  where it silently corrects. **Affected persona**: cognitive (a name briefly disagreeing with the
  page it links to). Accepted to avoid an extra request on every page load, which would cost the
  situational/flaky-network persona more.
- **A deleted pinned city** clears only once its detail page is actually visited and returns 404;
  until then the header link leads to the existing "City not found" page, which itself offers "Back
  to city list". **Affected persona**: cognitive, screen reader.
- **No confirmation dialog on "Forget my saved preferences".** A single activation discards the
  stored home city, recoverable only by re-pinning it (one press on that city's page). **Affected
  persona**: motor/switch (mis-activation risk), cognitive. Accepted deliberately — a confirmation
  modal would add a focus trap and return-focus contract for a one-field, trivially-recoverable
  deletion.
- **Storage-blocked browsers** keep the pin for the current tab's session only. This is announced
  once, at the point of the first failed write, not proactively on page load (to avoid nagging
  visitors whose storage works fine). **Affected persona**: situational.
- **The forget control is permanently visible**, including for visitors who have never pinned
  anything, where activating it announces "Nothing saved to forget." **Affected persona**: cognitive
  (a control whose purpose is unclear before first use). Accepted because the alternatives —
  conditional rendering or a `disabled` state — both remove the control from the keyboard tab
  sequence at the exact moment a visitor might reach for it, which is a worse outcome.
- **Single React root assumption.** The provider is a module-scoped singleton within one React root;
  this SPA has exactly one root, so this is not a live limitation today, only a note for the future
  (same caveat `packages/ui/src/announcer.ts`, spec 005, already records).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor who pins a city sees the pin reflected (toggle pressed, header link present,
  list ordering) after a full page reload with no server round trip involved in restoring it,
  verified by `e2e/visitor-context.spec.ts`'s reload test.
- **SC-002**: Every new interactive element has a unique, state-stable accessible name and correct
  ARIA state, verified by explicit name assertions (not solely automated scans, since the relevant
  WCAG 2.5.3 failure mode is not covered by this project's axe ruleset).
- **SC-003**: Automated axe scans report zero `serious`/`critical` violations on every new and
  modified page state (list unpinned, list pinned, detail unpinned, detail pinned, post-forget),
  component-level and end-to-end.
- **SC-004**: A visitor whose browser blocks persistent storage can still use the pin for the
  duration of their tab session and is told, once, that it will not survive closing the tab —
  verified by `visitor-context-store.test.ts`'s throwing-storage cases.
- **SC-005**: No new server route, database table, or write-scoped credential exists anywhere in the
  repository after this change — verified by the existing `packages/api/src/app.test.ts` assertion
  that no route other than `GET` is registered, unchanged and still passing.

## Assumptions

- Persistence is scoped to one browser profile on one device; there is no cross-device sync, no
  account, and no server-side identity of any kind. This is a deliberate, permanent property of the
  feature, not a placeholder for a future login system.
- Exactly one home city may be pinned at a time. A list of favorites, recently-viewed cities, a
  persisted forecast-tab choice, and a unit-of-measurement preference were all considered as part of
  the same underlying visitor-context layer and are explicitly deferred, not built in this iteration.
  The storage schema (`VisitorContextState`) is designed so each is a new optional field plus one
  narrowing check in the store's validator, without a breaking version bump.
- React Aria Components' `ToggleButton` (already a dependency via `@weather-demo/ui`) was chosen over
  its `Switch` for the pin control: a switch implies an always-on setting surface, whereas this is a
  one-shot "mark this thing" action, and `aria-pressed` on a button is the pattern the WAI-ARIA APG
  names for exactly that.
- The preference controls (home-city link, forget button) live in the header, per an explicit
  decision to keep them always reachable rather than behind a new `/settings` route or tucked into
  the footer.

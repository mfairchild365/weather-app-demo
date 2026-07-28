# Feature Specification: Shared Live-Region Announcer

**Feature Branch**: `005-live-region-announcer`

**Created**: 2026-07-28

**Status**: Implemented

**Input**: User description: "For aria-live messages, create (or use if already existing) a shared
js aria live announcer utility. The utility should 1) inject a visually-hidden aria-live region at
the bottom of the page, 2) queue messages, 3) populate the live region with the current message,
and then delete it after 500ms. All aria live messages should be routed through this utility. This
should help to reduce chances of conflicting messages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One serialized announcement stream, not four independent regions (Priority: P1)

Today every screen-reader announcement in the app comes from a separate inline live region
(`packages/ui/src/StatusMessage.tsx`, mounted four times: `#city-list-status`,
`#city-list-error`, `#city-detail-status`, `#city-detail-error`). Two of those regions can be live
on the same page at once, so a polite update and an assertive error can fire in the same tick with
no ordering guarantee, and a message identical to the region's current text announces nothing at
all. A visitor using a screen reader instead gets every announcement — status and error, from
either page — through one shared queue that guarantees ordering and that a repeated message is
still heard.

**Why this priority**: This is the entire scope of the feature; there is no lower-priority slice.

**Independent Test**: Trigger a city-list count update and a fetch failure in quick succession;
confirm both are announced, in order, with neither dropped or garbled. Load the city detail page
for an unknown slug and confirm the "City not found" heading is announced even though that branch
renders before any `StatusMessage`.

**Acceptance Scenarios**:

1. **Given** the city list is loading, **When** the fetch completes and the result count changes,
   **Then** the polite announcement fires exactly once with the final count — no duplicate or
   missing announcement from React's effect timing.
2. **Given** two announcements are queued in the same tick (one polite, one assertive), **When**
   they are dequeued, **Then** each is written to its own region in the order queued, and each is
   audible — one does not overwrite or race the other.
3. **Given** an identical message is announced twice in a row (e.g. the filtered count returns to
   a value it already showed), **When** the second announcement is queued, **Then** it is still
   spoken — the region is cleared and rewritten, not left unchanged.
4. **Given** a visitor loads `/cities/<unknown-slug>`, **When** the "City not found" branch
   renders, **Then** its heading text is announced through the shared announcer even though that
   branch renders before either `StatusMessage` on that page.
5. **Given** any announcement is written, **When** 500ms elapse without a new announcement,
   **Then** the region's text is cleared, so a subsequent identical message is a genuine text
   change rather than a no-op.

### Edge Cases

- What happens when `announce()` is called with an empty or whitespace-only string? → Ignored; no
  region write, no queue entry (mirrors `StatusMessage`'s existing "empty string = nothing to
  announce" contract).
- What happens when the announcer module is imported outside a browser (`node` vitest project, SSR
  tooling)? → `announce()` is a no-op guarded on `typeof document === 'undefined'`; no crash on
  import.
- What happens under React `<StrictMode>` (dev double-invoked effects)? → `StatusMessage` tracks
  the last message it announced and only calls `announce()` on an actual change, so a
  double-invoked effect does not double-queue the same text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A single shared utility (`packages/ui/src/announcer.ts`, exported as `announce()`)
  MUST be the only path by which any part of the app writes to a screen-reader live region.
- **FR-002**: On first use, the utility MUST inject two visually-hidden regions at the end of
  `document.body` — one `role="status"` (polite) and one `role="alert"` (assertive) — created
  empty, before any text is written to either.
- **FR-003**: `announce(message, politeness?)` MUST queue the message rather than writing
  immediately when another message is currently displayed, so messages are delivered one at a
  time in the order queued regardless of politeness.
- **FR-004**: A displayed message MUST be cleared from its region 500ms after being written,
  whether or not another message is queued behind it, so a subsequent identical message always
  produces an observable text change.
- **FR-005**: `StatusMessage` (`packages/ui/src/StatusMessage.tsx`) MUST keep rendering its
  `message` prop as visible text at its existing `id`, for sighted users and for the existing
  Playwright id-based locators, but MUST NOT itself carry `role="status"`/`role="alert"` — it
  calls `announce()` instead. Visible copy, ids, and the `politeness` prop's public shape are
  unchanged; only the live-region mechanism moves to the shared utility.
- **FR-006**: The `CityDetailPage` "City not found" branch, which renders before either of that
  page's `StatusMessage`s, MUST announce its heading text directly via `announce()` on mount.

### Key Entities

No new backend entities or endpoints. Presentation-only: a new client-side module with no
persisted state.

## Accessibility

**Affected personas**: screen reader (the entire point of this feature); no change for
keyboard-only, low-vision, cognitive, deaf/HoH, motor/voice/switch, or situational personas — no
visible layout, focus, or interaction changes.

### components

- **Announcer** — new `packages/ui/src/announcer.ts`. Not a React component; a module-level
  singleton that owns two native live regions (ladder tier 3 — native `role`/`aria-live`
  semantics, no custom ARIA widget behavior). Visually hidden via clip-path CSS (not
  `display:none`/`hidden`, which would remove the regions from the accessibility tree).
- **StatusMessage** (`packages/ui/src/StatusMessage.tsx`, from spec 003) — unchanged public
  contract; now renders plain visible text and calls `announce()` instead of owning its own live
  region.

### labels

No new labeled controls. No accessible-name changes — every message template and trigger listed
in spec 004's `status_messages` table (superseded there from spec 003) is unchanged; this feature
changes only the delivery mechanism, not the wording.

### grouping

Not applicable — no form controls.

### keyboard

No change. This feature adds no interactive elements and moves no focus.

### dynamic_state

The two announcer regions are the only elements whose content changes outside of ordinary
React re-render: `announce()` mutates `textContent` directly, then clears it 500ms later. This is
an implementation detail behind the same triggers already documented per-message in spec 004;
downstream consumers (developers reading this spec) should not add a third live-region mechanism
— extend `announce()` instead (FR-001).

### status_messages

Every row of spec 004's `status_messages` table applies unchanged — same templates, same
triggers, same politeness. This spec adds one row that spec 004 could not yet make audible:

| Region | Politeness | Template | Trigger |
|---|---|---|---|
| *(all rows from spec 004's table)* | — | — | unchanged; see `specs/004-probably-weather-personality/spec.md` |
| Shared assertive announcer | `alert` (assertive) | "City not found" | `CityDetailPage` renders its 404 branch (previously not announced at all — FR-006) |

All of the above are now delivered through `packages/ui/src/announcer.ts`'s two regions
(`[data-announcer="polite"]` / `[data-announcer="assertive"]`) rather than through the
`#city-list-status` / `#city-list-error` / `#city-detail-status` / `#city-detail-error` elements
directly; those elements remain in the DOM at the same ids with the same visible text, for sighted
users and existing e2e locators, but are no longer themselves live regions.

### testing

- `packages/ui/src/announcer.test.tsx` (new, jsdom project, fake timers): region injection
  (lazy, once, both empty), politeness routing, queue ordering across mixed politeness, 500ms
  clear, repeat-message re-announcement, empty-string no-op.
- `packages/ui/src/StatusMessage.test.tsx` (rewritten): visible text at `id`; no `role` on the
  element itself; announces through the correct announcer region on message change; does not
  re-announce identical text; axe-clean.
- `packages/web/src/routes/CityListPage.test.tsx` and `CityDetailPage.test.tsx`: status/error
  assertions switched from `screen.getByRole('status'|'alert')` to id-based lookups
  (`document.getElementById(...)`), since the elements no longer carry those roles; behavior
  otherwise unchanged. `resetAnnouncer()` added to each file's `afterEach` so announcer state
  (injected regions, pending timers) cannot leak between test cases.
- `packages/web/src/components/CurrentConditions.test.tsx` (spec 004, unchanged): its assertion
  that the verdict line is not inside `[role="status"]`/`[role="alert"]` continues to pass and
  continues to guarantee the verdict is never routed through `announce()`.
- End-to-end: `e2e/city-list.spec.ts` re-run unmodified — its `#city-list-status` id locators are
  unaffected since the id and visible text are preserved. Full suite (`city-list`, `city-detail`,
  `keyboard-navigation`) re-run against a rebuilt production container, including the axe checks.

### known_limitations

- The 500ms display/clear window is fixed, not configurable per message. A very long message
  queued behind several others could in principle wait multiple display windows before being
  read; with this app's short, infrequent messages (loading/count/error text) that is not an
  observed issue, but a future high-frequency-announcement feature should revisit the timing
  rather than assume it scales.
- The announcer is a global singleton with module-level state; two independent React roots on the
  same page (not a scenario this app has) would share one announcer instance. Acceptable here — a
  single-page app, one root.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every existing live-region announcement in the app (spec 004's `status_messages`
  table, in full) is audible with the same wording and politeness after this change, verified by
  the updated component/route tests and unmodified e2e specs.
- **SC-002**: A message identical to the previously-displayed one in the same region is announced
  again (not silently dropped), verified by `announcer.test.tsx`.
- **SC-003**: The `CityDetailPage` 404 branch produces an announcement, verified by a new test
  assertion — previously this branch announced nothing.
- **SC-004**: Automated axe scans (component-level and full-page e2e) report zero `serious`/
  `critical` violations on every page and state, unchanged from spec 004's SC-003.

## Assumptions

- This is a mechanism change, not a new user-facing feature: no new copy, no new visible UI, no
  new interactive surface. Scope is limited to how existing announcements are delivered.
- Two regions (polite + assertive), one shared queue — chosen over a single polite-only region so
  errors keep their assertive urgency, and over per-message dynamic `aria-live` toggling, which
  `references/status-messages.md` explicitly warns against.

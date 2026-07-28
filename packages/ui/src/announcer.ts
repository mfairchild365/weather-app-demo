export type AnnouncePoliteness = 'polite' | 'assertive';

interface QueuedMessage {
  message: string;
  politeness: AnnouncePoliteness;
}

// Visually-hidden per references/status-messages.md's "hiding the live region" pitfall: clip
// instead of `display:none`/`hidden`, which would make the content unavailable to AT.
const VISUALLY_HIDDEN_STYLE =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
  'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;';

const DISPLAY_MS = 500;
const GAP_MS = 100;

let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;
let queue: QueuedMessage[] = [];
let pumping = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function ensureRegions(): void {
  if (politeRegion && assertiveRegion) return;

  // role="status" implies aria-live="polite" + aria-atomic="true"; role="alert" implies
  // assertive + atomic. Prefer the roles over raw aria-live attributes, and never combine
  // role="alert" with an explicit aria-live — references/status-messages.md.
  politeRegion = document.createElement('div');
  politeRegion.setAttribute('role', 'status');
  politeRegion.setAttribute('data-announcer', 'polite');
  politeRegion.setAttribute('style', VISUALLY_HIDDEN_STYLE);

  assertiveRegion = document.createElement('div');
  assertiveRegion.setAttribute('role', 'alert');
  assertiveRegion.setAttribute('data-announcer', 'assertive');
  assertiveRegion.setAttribute('style', VISUALLY_HIDDEN_STYLE);

  // Both regions are created empty, before any text is written — inserting a live-region
  // element at the same time as its content risks AT missing the announcement.
  document.body.append(politeRegion, assertiveRegion);
}

function regionFor(politeness: AnnouncePoliteness): HTMLElement {
  ensureRegions();
  return politeness === 'assertive' ? assertiveRegion! : politeRegion!;
}

function pump(): void {
  const next = queue.shift();
  if (!next) {
    pumping = false;
    return;
  }
  pumping = true;
  const region = regionFor(next.politeness);
  region.textContent = next.message;
  pendingTimer = setTimeout(() => {
    region.textContent = '';
    pendingTimer = setTimeout(pump, GAP_MS);
  }, DISPLAY_MS);
}

/**
 * Queue a message for screen-reader announcement. Routes through one of two shared, singleton
 * live regions (polite / assertive) injected once at the bottom of `<body>`, so announcements
 * from anywhere in the app are serialized instead of racing each other across independent
 * regions. Empty/whitespace-only messages are ignored.
 */
export function announce(message: string, politeness: AnnouncePoliteness = 'polite'): void {
  if (typeof document === 'undefined') return;
  if (!message || !message.trim()) return;
  queue.push({ message, politeness });
  if (!pumping) pump();
}

/** Test-only teardown: clears the queue, cancels pending timers, and removes the injected
 * regions so state cannot leak between test cases. */
export function resetAnnouncer(): void {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  queue = [];
  pumping = false;
  politeRegion?.remove();
  assertiveRegion?.remove();
  politeRegion = null;
  assertiveRegion = null;
}

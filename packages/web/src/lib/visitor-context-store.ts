/**
 * Client-only, browser-persisted visitor preferences (spec 006). This module owns the storage
 * mechanics only — parsing, validating, and degrading gracefully; `context/VisitorContextProvider`
 * owns the React-facing API. Storage is injected via `StorageLike` rather than reached for
 * ambient `localStorage` so this file can be unit-tested in the vitest `node` project (no jsdom)
 * and so quota/permission failures — untestable against a real Storage — can be simulated.
 *
 * Extending the persisted shape (e.g. a future recently-viewed list or unit preference): add an
 * optional field to `VisitorContextState`, a narrowing function for it, and one line in `parse()`.
 * Keep `version` at 1 for additive, optional-with-a-default fields; bump only on a breaking rename
 * or removal — this is a preference cache, not a source of truth, so a version bump may simply
 * discard the old value rather than migrate it.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface HomeCity {
  slug: string;
  name: string;
  regionName: string;
}

export interface VisitorContextState {
  version: 1;
  homeCity: HomeCity | null;
}

export interface WriteResult {
  /** false when the write only landed in memory (storage absent, disabled, or over quota). */
  durable: boolean;
}

export interface VisitorContextStore {
  read(): VisitorContextState;
  write(next: VisitorContextState): WriteResult;
  clear(): WriteResult;
  /** Parse a raw value observed via a cross-tab `storage` event, with the same validator `read()`
   *  uses, so a foreign/malformed write from another tab can't inject an invalid shape. */
  parse(raw: string | null): VisitorContextState;
  readonly key: string;
}

export const VISITOR_CONTEXT_KEY = 'probably-weather:visitor-context';
export const VISITOR_CONTEXT_VERSION = 1;
export const DEFAULT_VISITOR_CONTEXT: VisitorContextState = { version: 1, homeCity: null };

function isHomeCity(value: unknown): value is HomeCity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.slug === 'string' &&
    candidate.slug.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.length > 0 &&
    typeof candidate.regionName === 'string'
  );
}

/** Narrows and copies a raw parsed blob into a valid state, discarding anything that doesn't fit.
 * The envelope (`version`) and the `homeCity` payload are validated independently: a valid version
 * with a garbage `homeCity` yields `{ version: 1, homeCity: null }` rather than being thrown away
 * wholesale, so one bad field can't corrupt sibling fields added by a future version. */
function parseState(raw: string | null): VisitorContextState {
  if (raw === null) return DEFAULT_VISITOR_CONTEXT;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_VISITOR_CONTEXT;
  }

  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_VISITOR_CONTEXT;
  const blob = parsed as Record<string, unknown>;
  if (blob.version !== VISITOR_CONTEXT_VERSION) return DEFAULT_VISITOR_CONTEXT;

  // Narrow first, then rebuild field-by-field — rebuilding (not spreading the narrowed object)
  // drops any foreign keys, so a future version 2 reader never inherits junk left over from an
  // old or hand-edited value.
  const homeCity = blob.homeCity;
  return {
    version: 1,
    homeCity: isHomeCity(homeCity)
      ? { slug: homeCity.slug, name: homeCity.name, regionName: homeCity.regionName }
      : null,
  };
}

/** Creates a store bound to a specific storage backend, or to none at all (`null`). Every method
 * degrades to an in-memory value on any thrown error (missing storage, disabled storage, quota
 * exceeded, blocked cookies/storage access) — the pin still works for the rest of the tab's
 * session, it just isn't durable. `read()` prefers the in-memory value when set, so a degraded
 * store stays internally consistent within one session even though nothing was ever written. */
export function createVisitorContextStore(storage: StorageLike | null): VisitorContextStore {
  let memory: VisitorContextState | null = null;

  function read(): VisitorContextState {
    if (memory) return memory;
    if (!storage) return DEFAULT_VISITOR_CONTEXT;
    try {
      return parseState(storage.getItem(VISITOR_CONTEXT_KEY));
    } catch {
      return DEFAULT_VISITOR_CONTEXT;
    }
  }

  function write(next: VisitorContextState): WriteResult {
    memory = next;
    if (!storage) return { durable: false };
    try {
      storage.setItem(VISITOR_CONTEXT_KEY, JSON.stringify(next));
      return { durable: true };
    } catch {
      return { durable: false };
    }
  }

  function clear(): WriteResult {
    memory = DEFAULT_VISITOR_CONTEXT;
    if (!storage) return { durable: false };
    try {
      storage.removeItem(VISITOR_CONTEXT_KEY);
      return { durable: true };
    } catch {
      return { durable: false };
    }
  }

  return { read, write, clear, parse: parseState, key: VISITOR_CONTEXT_KEY };
}

/** Resolves `globalThis.localStorage` behind a try/catch — merely accessing the property throws
 * in some storage-blocked configurations (not just calling its methods) — and degrades to `null`
 * (in-memory-only) rather than letting that throw escape to the caller. */
export function resolveBrowserStorage(): StorageLike | null {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
    const storage = globalThis.localStorage;
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
}

export const visitorContextStore: VisitorContextStore = createVisitorContextStore(
  resolveBrowserStorage(),
);

/** Test-only teardown, mirroring `packages/ui/src/announcer.ts`'s `resetAnnouncer()`: clears the
 * default singleton's persisted and in-memory state so it cannot leak between test cases. */
export function resetVisitorContextStore(): void {
  visitorContextStore.clear();
}

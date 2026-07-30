import { describe, it, expect, vi } from 'vitest';
import {
  createVisitorContextStore,
  resetVisitorContextStore,
  visitorContextStore,
  DEFAULT_VISITOR_CONTEXT,
  VISITOR_CONTEXT_KEY,
  VISITOR_CONTEXT_VERSION,
  type StorageLike,
  type VisitorContextState,
} from './visitor-context-store';

/** Minimal in-memory Storage fake. Real enough for round-trip tests; individual tests override
 * `getItem`/`setItem` to simulate throwing storage (quota exceeded, blocked access). */
function createFakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('createVisitorContextStore', () => {
  it('reads DEFAULT_VISITOR_CONTEXT from empty storage', () => {
    const store = createVisitorContextStore(createFakeStorage());
    expect(store.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
  });

  it('round-trips a written home city and reports a durable write', () => {
    const store = createVisitorContextStore(createFakeStorage());
    const state: VisitorContextState = {
      version: 1,
      homeCity: { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' },
    };
    expect(store.write(state)).toEqual({ durable: true });
    expect(store.read()).toEqual(state);
  });

  it('falls back to defaults on malformed JSON without throwing', () => {
    const storage = createFakeStorage();
    storage.data.set(VISITOR_CONTEXT_KEY, '{oops');
    const store = createVisitorContextStore(storage);
    expect(() => store.read()).not.toThrow();
    expect(store.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
  });

  it('falls back to defaults on a version mismatch', () => {
    const storage = createFakeStorage();
    storage.data.set(
      VISITOR_CONTEXT_KEY,
      JSON.stringify({ version: 2, homeCity: { slug: 'x', name: 'X', regionName: 'Y' } }),
    );
    const store = createVisitorContextStore(storage);
    expect(store.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
  });

  it('keeps a valid envelope but nulls a foreign-shaped homeCity', () => {
    const storage = createFakeStorage();
    storage.data.set(
      VISITOR_CONTEXT_KEY,
      JSON.stringify({ version: VISITOR_CONTEXT_VERSION, homeCity: 42 }),
    );
    const store = createVisitorContextStore(storage);
    expect(store.read()).toEqual({ version: 1, homeCity: null });
  });

  it('nulls a partial homeCity missing required fields', () => {
    const storage = createFakeStorage();
    storage.data.set(
      VISITOR_CONTEXT_KEY,
      JSON.stringify({ version: VISITOR_CONTEXT_VERSION, homeCity: { slug: 'x' } }),
    );
    const store = createVisitorContextStore(storage);
    expect(store.read()).toEqual({ version: 1, homeCity: null });
  });

  it('strips extra keys from a stored homeCity', () => {
    const storage = createFakeStorage();
    storage.data.set(
      VISITOR_CONTEXT_KEY,
      JSON.stringify({
        version: VISITOR_CONTEXT_VERSION,
        homeCity: { slug: 'x', name: 'X', regionName: 'Y', extra: 'junk' },
      }),
    );
    const store = createVisitorContextStore(storage);
    expect(store.read()).toEqual({
      version: 1,
      homeCity: { slug: 'x', name: 'X', regionName: 'Y' },
    });
  });

  it('degrades to in-memory when getItem throws, without throwing itself', () => {
    const storage: StorageLike = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const store = createVisitorContextStore(storage);
    expect(() => store.read()).not.toThrow();
    expect(store.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
  });

  it('reports durable:false when setItem throws, but keeps the value in memory for the session', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: vi.fn(),
    };
    const store = createVisitorContextStore(storage);
    const state: VisitorContextState = {
      version: 1,
      homeCity: { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' },
    };
    expect(store.write(state)).toEqual({ durable: false });
    // In-memory continuity: even though the underlying storage never persisted it, this store
    // instance still returns the value for the rest of the session.
    expect(store.read()).toEqual(state);
  });

  it('is fully functional in memory when constructed with null storage, and always durable:false', () => {
    const store = createVisitorContextStore(null);
    const state: VisitorContextState = {
      version: 1,
      homeCity: { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' },
    };
    expect(store.write(state)).toEqual({ durable: false });
    expect(store.read()).toEqual(state);
  });

  it('clear() resets to defaults and removes the underlying key', () => {
    const storage = createFakeStorage();
    const store = createVisitorContextStore(storage);
    store.write({ version: 1, homeCity: { slug: 'x', name: 'X', regionName: 'Y' } });
    expect(store.clear()).toEqual({ durable: true });
    expect(store.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
    expect(storage.data.has(VISITOR_CONTEXT_KEY)).toBe(false);
  });

  it('parse() applies the same validation as read(), for cross-tab storage events', () => {
    const store = createVisitorContextStore(createFakeStorage());
    expect(store.parse(null)).toEqual(DEFAULT_VISITOR_CONTEXT);
    expect(
      store.parse(
        JSON.stringify({ version: 1, homeCity: { slug: 'x', name: 'X', regionName: 'Y' } }),
      ),
    ).toEqual({ version: 1, homeCity: { slug: 'x', name: 'X', regionName: 'Y' } });
    expect(store.parse('not json')).toEqual(DEFAULT_VISITOR_CONTEXT);
  });

  it('exposes the storage key used', () => {
    const store = createVisitorContextStore(createFakeStorage());
    expect(store.key).toBe(VISITOR_CONTEXT_KEY);
  });
});

describe('resetVisitorContextStore', () => {
  it('returns the default singleton to its default state', () => {
    visitorContextStore.write({
      version: 1,
      homeCity: { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' },
    });
    resetVisitorContextStore();
    expect(visitorContextStore.read()).toEqual(DEFAULT_VISITOR_CONTEXT);
  });
});

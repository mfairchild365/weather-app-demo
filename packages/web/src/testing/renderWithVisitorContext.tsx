/**
 * Test-only render helper (spec 006). Not collected by either vitest project (its filename
 * matches neither `*.test.ts` nor `*.test.tsx`) and never imported by application code, so it is
 * tree-shaken out of the production bundle.
 *
 * `useVisitorContext()` throws when rendered outside a `<VisitorContextProvider>` (see
 * `context/visitor-context.ts`), so any test rendering a page/route/component that reads visitor
 * context must go through this helper rather than a bare `render(<MemoryRouter>...`.
 */
import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  createVisitorContextStore,
  VISITOR_CONTEXT_KEY,
  type HomeCity,
  type StorageLike,
  type VisitorContextState,
  type VisitorContextStore,
} from '../lib/visitor-context-store';
import { VisitorContextProvider } from '../context/VisitorContextProvider';

/** A fresh in-memory Storage fake, optionally pre-seeded with a visitor-context state, plus the
 * backing map for tests that want to inspect raw stored JSON directly. */
export function createTestStorage(seed?: VisitorContextState): {
  storage: StorageLike;
  map: Map<string, string>;
} {
  const map = new Map<string, string>();
  if (seed) map.set(VISITOR_CONTEXT_KEY, JSON.stringify(seed));
  const storage: StorageLike = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
  return { storage, map };
}

export interface VisitorContextHarness {
  /** The store backing this render, for asserting persisted writes directly. */
  store: VisitorContextStore;
}

export interface RenderWithVisitorContextOptions {
  /** Initial router location. Defaults to '/'. */
  route?: string;
  /** Pre-seeds the store with a pinned home city, as if a prior visit had set it. */
  homeCity?: HomeCity;
  /** Supply a specific store instance (e.g. one whose storage throws) instead of an isolated
   *  fresh one. */
  store?: VisitorContextStore;
}

/** Renders `ui` inside an isolated `MemoryRouter` + `VisitorContextProvider`, so any page or
 * component under test can call `useVisitorContext()` without reaching for the app's real
 * `localStorage`-backed singleton. Each call gets its own store — state never leaks between
 * tests. `ui` may be a single component or a `<Routes>` tree (for tests that need dynamic route
 * matching, e.g. `/cities/:slug`). */
export function renderWithVisitorContext(
  ui: ReactElement,
  options: RenderWithVisitorContextOptions = {},
): RenderResult & VisitorContextHarness {
  const { route = '/', homeCity, store } = options;
  const activeStore =
    store ??
    createVisitorContextStore(
      createTestStorage(homeCity ? { version: 1, homeCity } : undefined).storage,
    );

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <VisitorContextProvider store={activeStore}>{ui}</VisitorContextProvider>
    </MemoryRouter>,
  );

  return { ...result, store: activeStore };
}

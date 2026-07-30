import { createContext, useContext } from 'react';
import type { HomeCity } from '../lib/visitor-context-store';

export interface VisitorContextValue {
  homeCity: HomeCity | null;
  /** false when the *last* write to storage did not reach durable storage (blocked/quota-exceeded
   *  localStorage) — the value still works for the rest of this tab's session. Reflects history,
   *  not necessarily the write a caller just made — callers that need to react to their own
   *  write's outcome should use `setHomeCity`'s return value instead, to avoid acting on a stale
   *  pre-render value. */
  isDurable: boolean;
  /** Returns whether this specific write reached durable storage — read synchronously, not from
   *  `isDurable` (which only updates on the next render). */
  setHomeCity(city: HomeCity): boolean;
  clearHomeCity(): void;
  /** Reconciles a stale cached display name against freshly-fetched data. A no-op when the
   *  incoming name/regionName already match — safe to call on every render of a data-bearing
   *  effect without producing redundant writes. */
  reconcileHomeCity(city: HomeCity): void;
  /** Clears all stored visitor-context data. Returns whether anything was actually stored, so
   *  callers can distinguish "cleared something" from "there was nothing to clear". */
  forgetAll(): boolean;
}

// Deliberately no working no-op default: a default that silently accepts writes would let a page
// render a working-looking pin toggle that persists nothing, a bug that would only surface on
// reload in production. See VisitorContextProvider.tsx and specs/006-visitor-context/spec.md.
export const VisitorContext = createContext<VisitorContextValue | undefined>(undefined);

/** Throws when used outside <VisitorContextProvider> rather than falling back to a no-op value —
 * see the context object's comment above. Tests should render through
 * `src/testing/renderWithVisitorContext.tsx`, which supplies an isolated in-memory provider. */
export function useVisitorContext(): VisitorContextValue {
  const value = useContext(VisitorContext);
  if (value === undefined) {
    throw new Error(
      'useVisitorContext must be used inside <VisitorContextProvider>. ' +
        'Tests should render through src/testing/renderWithVisitorContext.tsx.',
    );
  }
  return value;
}

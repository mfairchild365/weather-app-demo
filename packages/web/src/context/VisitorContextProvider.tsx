import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  visitorContextStore,
  type HomeCity,
  type VisitorContextState,
  type VisitorContextStore,
} from '../lib/visitor-context-store';
import { VisitorContext, type VisitorContextValue } from './visitor-context';

export interface VisitorContextProviderProps {
  children: ReactNode;
  /** Test seam only — defaults to the module-level singleton store bound to `localStorage` (or an
   *  in-memory fallback when unavailable). Tests should use
   *  `src/testing/renderWithVisitorContext.tsx`'s isolated store instead of overriding this
   *  directly in application code. */
  store?: VisitorContextStore;
}

function sameHomeCity(a: HomeCity, b: HomeCity): boolean {
  return a.slug === b.slug && a.name === b.name && a.regionName === b.regionName;
}

/**
 * Single source of truth for client-only visitor preferences (spec 006). Two rules make React
 * <StrictMode>'s double-invocation a non-issue rather than something to guard against:
 *
 * 1. Hydration happens in the `useState` lazy initializer, never in a `useEffect`. An
 *    effect-based read would render one frame with `homeCity: null` before the real value
 *    appears, popping the header link in on every page load. The lazy initializer is a pure
 *    read, so StrictMode invoking it twice is harmless.
 * 2. State is never mirrored to storage via an effect. Every write happens inside an action
 *    callback (`setHomeCity`/`clearHomeCity`/`forgetAll`/`reconcileHomeCity`), i.e. only in
 *    response to a user action or a value-guarded reconcile — never as a side effect of a
 *    render — so there is nothing for StrictMode to double-invoke.
 */
export function VisitorContextProvider({ children, store }: VisitorContextProviderProps) {
  const activeStore = store ?? visitorContextStore;

  const [state, setState] = useState<VisitorContextState>(() => activeStore.read());
  const [isDurable, setIsDurable] = useState(true);

  const setHomeCity = useCallback(
    (city: HomeCity): boolean => {
      const next: VisitorContextState = { version: 1, homeCity: city };
      const result = activeStore.write(next);
      setState(next);
      setIsDurable(result.durable);
      return result.durable;
    },
    [activeStore],
  );

  const clearHomeCity = useCallback(() => {
    const next: VisitorContextState = { version: 1, homeCity: null };
    const result = activeStore.write(next);
    setState(next);
    setIsDurable(result.durable);
  }, [activeStore]);

  const reconcileHomeCity = useCallback(
    (city: HomeCity) => {
      setState((current) => {
        if (!current.homeCity) return current;
        if (current.homeCity.slug !== city.slug) return current;
        if (sameHomeCity(current.homeCity, city)) return current;
        const next: VisitorContextState = { version: 1, homeCity: city };
        activeStore.write(next);
        return next;
      });
    },
    [activeStore],
  );

  const forgetAll = useCallback((): boolean => {
    const hadSomething = state.homeCity !== null;
    activeStore.clear();
    setState({ version: 1, homeCity: null });
    setIsDurable(true);
    return hadSomething;
  }, [activeStore, state.homeCity]);

  // Cross-tab sync: another tab writing to the same storage key fires a `storage` event in this
  // tab. Re-uses the store's own `parse()` so a foreign/malformed write still can't inject an
  // invalid shape. Deliberately does not call announce() — an announcement here would be
  // attributed to an action the visitor did not take in this tab (a "chatty region" failure per
  // references/status-messages.md).
  useEffect(() => {
    function onStorage(event: StorageEvent): void {
      // A null key means the whole storage was cleared (e.g. localStorage.clear()), which also
      // affects this key.
      if (event.key !== null && event.key !== activeStore.key) return;
      setState(activeStore.parse(event.newValue));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [activeStore]);

  const value = useMemo<VisitorContextValue>(
    () => ({
      homeCity: state.homeCity,
      isDurable,
      setHomeCity,
      clearHomeCity,
      reconcileHomeCity,
      forgetAll,
    }),
    [state.homeCity, isDurable, setHomeCity, clearHomeCity, reconcileHomeCity, forgetAll],
  );

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>;
}

import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Moves focus to `<main>` on every client-side route change (spec FR-010) — skips the very first
 * render, since the browser's own initial-load focus is already reasonable there.
 */
export function useFocusMainOnRouteChange(mainRef: RefObject<HTMLElement | null>): void {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mainRef identity is stable
  }, [location.pathname]);
}

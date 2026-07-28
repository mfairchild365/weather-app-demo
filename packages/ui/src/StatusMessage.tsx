import { useEffect, useRef } from 'react';
import { announce } from './announcer';

export type StatusPoliteness = 'status' | 'alert';

export interface StatusMessageProps {
  id: string;
  /** 'status' (polite) for loading/progress/counts; 'alert' (assertive) for errors only —
   * references/status-messages.md. */
  politeness: StatusPoliteness;
  /** Empty string renders the region with no visible content — always mount this component,
   * never conditionally, so the visible text doesn't pop in and out. */
  message: string;
  className?: string;
}

/**
 * Visible status/error text, paired with a screen-reader announcement routed through the shared
 * `announce()` utility (./announcer.ts) rather than its own live region — a single pair of
 * app-wide live regions serializes announcements so a polite update and an assertive error can't
 * race each other across independently-mounted regions.
 */
export function StatusMessage({ id, politeness, message, className }: StatusMessageProps) {
  const lastAnnounced = useRef('');

  useEffect(() => {
    // Guards against re-announcing identical text on re-render, and against StrictMode's
    // double-invoked effects enqueueing the same message twice.
    if (!message || message === lastAnnounced.current) return;
    lastAnnounced.current = message;
    announce(message, politeness === 'alert' ? 'assertive' : 'polite');
  }, [message, politeness]);

  return (
    <div id={id} className={className}>
      {message}
    </div>
  );
}

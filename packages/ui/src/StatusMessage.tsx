export type StatusPoliteness = 'status' | 'alert';

export interface StatusMessageProps {
  id: string;
  /** 'status' (polite) for loading/progress/counts; 'alert' (assertive) for errors only —
   * references/status-messages.md. */
  politeness: StatusPoliteness;
  /** Empty string renders the region with no visible/announced content — always mount this
   * component, never conditionally, so the element exists in the DOM before its text changes. */
  message: string;
  className?: string;
}

/**
 * A live region rendered once and mutated via `message`, never toggled on/off or remounted —
 * required so assistive technology reliably announces the update (references/status-messages.md).
 */
export function StatusMessage({ id, politeness, message, className }: StatusMessageProps) {
  return (
    <div id={id} role={politeness} className={className}>
      {message}
    </div>
  );
}

export interface MascotProps {
  className?: string;
}

/**
 * Decorative brand mark — a deadpan little cloud, beside the header's text brand link which
 * already carries the accessible name (spec 004 FR-005). `aria-hidden` (ladder tier 5, justified
 * exactly as `SparklineChart.tsx`'s decorative chart was in spec 003: pure decoration, paired
 * with pre-existing accessible text, never the sole carrier of information). Single-color line
 * art via `currentColor` only — no hardcoded fills, so it adapts under dark mode and
 * `forced-colors: active` for free (references/contrast-forced-colors.md).
 */
export function Mascot({ className = '' }: MascotProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 17.5a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.53-2.03A4.5 4.5 0 0 1 18 16.5" />
      <path d="M6.5 17.5h11" />
      {/* Deadpan face: flat dot eyes, flat line mouth — no expression, on brand. */}
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9.5 15.5h5" />
    </svg>
  );
}

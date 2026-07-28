export interface SkipLinkProps {
  /** id of the element to jump to, without the leading '#'. */
  targetId: string;
}

/**
 * "Skip to main content" — must be the first focusable element on the page (spec FR-009,
 * references/keyboard-focus.md). Visually hidden until it receives focus.
 */
export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-[var(--color-focus)] focus:px-4 focus:py-2 focus:text-white focus:no-underline"
    >
      Skip to main content
    </a>
  );
}

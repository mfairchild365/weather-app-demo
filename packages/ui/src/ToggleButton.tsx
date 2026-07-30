import type { ReactNode } from 'react';
import {
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps,
} from 'react-aria-components';

export interface ToggleButtonProps extends Omit<
  AriaToggleButtonProps,
  'className' | 'children' | 'aria-label'
> {
  /** Visible text. MUST be state-neutral — per WCAG 4.1.2 and the WAI-ARIA APG Button pattern, a
   *  toggle button's accessible name must not change with its pressed state; state is conveyed
   *  by `aria-pressed` alone. Never pass e.g. "Set as home city" / "Remove home city" here. */
  label: string;
  /** Disambiguates the accessible name when several instances of the same `label` exist on a
   *  page (e.g. one toggle per city). When present, the accessible name is `"${label}:
   *  ${qualifier}"` — always a superset of `label`, so name-label match (WCAG 2.5.3) holds by
   *  construction rather than by convention. */
  qualifier?: string;
  /** Decorative state glyph rendered next to the label, e.g. a star that fills in when selected.
   *  Always rendered `aria-hidden` — state must never be conveyed by the icon alone. */
  renderIcon?: (isSelected: boolean) => ReactNode;
  className?: string;
}

const BASE =
  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ' +
  'outline-offset-2 outline-2 outline-transparent cursor-pointer ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

// Border weight (1px -> 2px) and the caller-supplied icon swap are the non-color cues that carry
// pressed state; both survive forced-colors mode, unlike a background-color-only change
// (references/contrast-forced-colors.md).
const UNSELECTED = 'border border-[var(--color-border)] bg-transparent text-[var(--color-text)]';
const SELECTED =
  'border-2 border-[var(--color-focus)] bg-[var(--color-surface)] text-[var(--color-text)]';
const FOCUS_VISIBLE = 'outline-[var(--color-focus)]';

/**
 * Wraps React Aria Components' ToggleButton: `aria-pressed`, Enter/Space activation, and focus
 * handling come from the library (`useToggleButton`); this wrapper adds only tokenized styling
 * and constructs the accessible name from `label` + `qualifier` so name-label match holds
 * structurally. Styled via the render-prop `className` form — NOT a `selected:` Tailwind variant,
 * which requires `tailwindcss-react-aria-components` (not installed in this repo; see
 * `Tabs.tsx`, where the `selected:` classes are consequently inert).
 */
export function ToggleButton({
  label,
  qualifier,
  renderIcon,
  className = '',
  ...props
}: ToggleButtonProps) {
  return (
    <AriaToggleButton
      {...props}
      {...(qualifier !== undefined ? { 'aria-label': `${label}: ${qualifier}` } : {})}
      className={({ isSelected, isFocusVisible }) =>
        [BASE, isSelected ? SELECTED : UNSELECTED, isFocusVisible ? FOCUS_VISIBLE : '', className]
          .filter(Boolean)
          .join(' ')
      }
    >
      {({ isSelected }) => (
        <>
          {renderIcon && <span aria-hidden="true">{renderIcon(isSelected)}</span>}
          {label}
        </>
      )}
    </AriaToggleButton>
  );
}

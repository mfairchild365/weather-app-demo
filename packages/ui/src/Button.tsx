import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  variant?: ButtonVariant;
  className?: string;
}

const BASE =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ' +
  'outline-offset-2 outline-2 outline-transparent focus-visible:outline-[var(--color-focus)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  // text-[var(--color-bg)], not hardcoded white: --color-focus inverts between a dark teal (light
  // theme) and a bright teal (dark theme), so pairing it with --color-bg (white / near-black,
  // also inverted) keeps this button's text >=4.5:1 in both themes — a hardcoded white text
  // color failed WCAG AA against the dark-theme accent (spec 004; see tokens.test.ts).
  primary: 'bg-[var(--color-focus)] text-[var(--color-bg)] hover:opacity-90',
  secondary:
    'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
};

/** Wraps React Aria Components' Button — keyboard/focus/disabled behavior comes for free. */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <AriaButton {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />;
}

import {
  SearchField as AriaSearchField,
  Label,
  Input,
  Button,
  type SearchFieldProps as AriaSearchFieldProps,
} from 'react-aria-components';

export interface SearchFieldProps extends Omit<AriaSearchFieldProps, 'children' | 'className'> {
  label: string;
  placeholder?: string;
  className?: string;
}

/**
 * Wraps React Aria Components' SearchField: a labeled text input with a keyboard-operable clear
 * control built in (spec `keyboard`), rather than hand-rolling one.
 */
export function SearchField({ label, placeholder, className = '', ...props }: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className={`flex flex-col gap-1 ${className}`}>
      <Label className="text-sm font-medium text-[var(--color-text)]">{label}</Label>
      <div className="relative flex items-center">
        <Input
          {...(placeholder !== undefined ? { placeholder } : {})}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text)] outline-offset-2 outline-2 outline-transparent focus-visible:outline-[var(--color-focus)]"
        />
        {/* React Aria Components only renders this button while the field has a value, and wires
            its press handler to clear the field and refocus the input — no visibility logic of
            our own needed. */}
        <Button
          aria-label="Clear search"
          className="absolute right-2 rounded p-1 text-[var(--color-muted-text)] outline-offset-2 outline-2 outline-transparent focus-visible:outline-[var(--color-focus)]"
        >
          ✕
        </Button>
      </div>
    </AriaSearchField>
  );
}

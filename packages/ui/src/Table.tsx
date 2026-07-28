import type { ReactNode } from 'react';

export interface TableProps {
  /** Required (not optional) so every table using this component names itself —
   * references/tables-grids.md: "Provide a <caption> naming the table". */
  caption: string;
  columns: string[];
  children: ReactNode;
  className?: string;
}

/**
 * Thin styled wrapper around native `<table>`/`<caption>`/`<th scope="col">` (and, via
 * `TableRowHeader`, `<th scope="row">`) for static tabular data (references/tables-grids.md) —
 * not an interactive grid, which this project has no need for.
 */
export function Table({ caption, columns, children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left text-sm ${className}`}>
        <caption className="mb-2 text-left font-medium text-[var(--color-text)]">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((column) => (
              <th key={column} scope="col" className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export interface TableRowProps {
  children: ReactNode;
}

export function TableRow({ children }: TableRowProps) {
  return <tr className="border-b border-[var(--color-border)] last:border-0">{children}</tr>;
}

export interface TableCellProps {
  children: ReactNode;
}

export function TableCell({ children }: TableCellProps) {
  return <td className="px-3 py-2">{children}</td>;
}

export interface TableRowHeaderProps {
  children: ReactNode;
}

/**
 * `<th scope="row">` for the first cell of a data row (references/tables-grids.md) — lets AT
 * announce the row's identifying value (e.g. the time or day) when reading any other cell in
 * that row. Styled to match `TableCell` since browsers bold/center `<th>` by default.
 */
export function TableRowHeader({ children }: TableRowHeaderProps) {
  return (
    <th scope="row" className="px-3 py-2 text-left font-normal">
      {children}
    </th>
  );
}

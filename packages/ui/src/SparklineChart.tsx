export interface SparklineChartProps {
  values: number[];
  /** Required (not optional) so every chart names itself — references/images-graphics.md: an
   * informative `<svg>` needs `role="img"` plus an accessible name. Should read like "Chart of
   * {thing}, data in table below" so screen reader users know the exact values are available as
   * text nearby rather than only in this trend line. */
  label: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Inline trend line whose exact values are always shown as real numbers in an accessible
 * `<table>` right next to this chart (spec FR-006) — the `label` is a short pointer to that
 * table, not a restatement of every value (references/images-graphics.md: complex graphics get a
 * fuller description available nearby).
 */
export function SparklineChart({
  values,
  label,
  width = 240,
  height = 60,
  className = '',
}: SparklineChartProps) {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      role="img"
      aria-label={label}
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
    >
      <polyline points={points} fill="none" stroke="var(--color-focus)" strokeWidth={2} />
    </svg>
  );
}

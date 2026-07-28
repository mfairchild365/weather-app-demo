export interface SparklineChartProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Purely decorative trend line — the same values are always shown as real numbers in an
 * accessible `<table>` right next to this chart (spec FR-006); this component carries no
 * information of its own and MUST stay `aria-hidden` (references/images-graphics.md).
 */
export function SparklineChart({
  values,
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
      aria-hidden="true"
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

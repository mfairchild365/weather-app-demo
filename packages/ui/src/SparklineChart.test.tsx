import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { SparklineChart } from './SparklineChart';

describe('SparklineChart', () => {
  it('is aria-hidden — purely decorative, never the sole source of data (FR-006)', () => {
    const { container } = render(<SparklineChart values={[10, 15, 12, 18]} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not exposed to the accessibility tree', async () => {
    const { container } = render(
      <div>
        <SparklineChart values={[10, 15, 12, 18]} />
        <p>Real data is in the table, not here.</p>
      </div>,
    );
    // An aria-hidden subtree must produce zero axe violations and contribute no accessible node.
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders nothing for an empty series', () => {
    const { container } = render(<SparklineChart values={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

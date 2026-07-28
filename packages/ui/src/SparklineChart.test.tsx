import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { SparklineChart } from './SparklineChart';

describe('SparklineChart', () => {
  it('exposes an accessible name pointing to the table, never the sole source of data (FR-006)', () => {
    render(
      <SparklineChart
        values={[10, 15, 12, 18]}
        label="Chart of Tokyo hourly temperature, data in table below"
      />,
    );
    const image = screen.getByRole('img', {
      name: 'Chart of Tokyo hourly temperature, data in table below',
    });
    expect(image.tagName).toBe('svg');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <SparklineChart
          values={[10, 15, 12, 18]}
          label="Chart of Tokyo hourly temperature, data in table below"
        />
        <p>Real data is in the table, not here.</p>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders nothing for an empty series', () => {
    const { container } = render(
      <SparklineChart values={[]} label="Chart of Tokyo hourly temperature, data in table below" />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Mascot } from './Mascot';

describe('Mascot', () => {
  it('is aria-hidden — decorative brand mark beside the accessible-named brand link (FR-005)', () => {
    const { container } = render(<Mascot />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not exposed to the accessibility tree', async () => {
    const { container } = render(
      <div>
        <Mascot />
        <p>Probably Weather</p>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

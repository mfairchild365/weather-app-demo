import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('is the first link and targets the given id', () => {
    render(
      <div>
        <SkipLink targetId="maincontent" />
        <a href="/other">Other link</a>
      </div>,
    );
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#maincontent');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SkipLink targetId="maincontent" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

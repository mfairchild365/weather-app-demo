import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { StatusMessage } from './StatusMessage';

describe('StatusMessage', () => {
  it('uses role="status" for polite messages', () => {
    render(<StatusMessage id="s1" politeness="status" message="Loading cities…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading cities…');
  });

  it('uses role="alert" for assertive messages', () => {
    render(<StatusMessage id="s2" politeness="alert" message="Couldn't load cities." />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load cities.");
  });

  it('stays mounted (same element) when its message changes, per status-messages.md', () => {
    const { rerender } = render(<StatusMessage id="s3" politeness="status" message="" />);
    const before = screen.getByRole('status');
    rerender(<StatusMessage id="s3" politeness="status" message="12 cities" />);
    const after = screen.getByRole('status');
    expect(after).toBe(before);
    expect(after).toHaveTextContent('12 cities');
  });

  it('has no axe violations', async () => {
    const { container } = render(<StatusMessage id="s4" politeness="status" message="Loading…" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

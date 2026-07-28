import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { StatusMessage } from './StatusMessage';
import { resetAnnouncer } from './announcer';

function politeRegion(): HTMLElement | null {
  return document.querySelector('[data-announcer="polite"]');
}

function assertiveRegion(): HTMLElement | null {
  return document.querySelector('[data-announcer="assertive"]');
}

afterEach(() => {
  resetAnnouncer();
});

describe('StatusMessage', () => {
  it('renders its message as visible text at the given id', () => {
    render(<StatusMessage id="s1" politeness="status" message="Loading cities…" />);
    expect(document.getElementById('s1')).toHaveTextContent('Loading cities…');
  });

  it('is not itself a live region — announcements go through the shared announcer', () => {
    render(<StatusMessage id="s2" politeness="alert" message="Couldn't load cities." />);
    const el = document.getElementById('s2');
    expect(el).not.toHaveAttribute('role');
    expect(el?.closest('[role="status"], [role="alert"]')).toBeNull();
  });

  it('stays mounted (same element) when its message changes, per status-messages.md', () => {
    const { rerender } = render(<StatusMessage id="s3" politeness="status" message="" />);
    const before = document.getElementById('s3');
    rerender(<StatusMessage id="s3" politeness="status" message="12 cities" />);
    const after = document.getElementById('s3');
    expect(after).toBe(before);
    expect(after).toHaveTextContent('12 cities');
  });

  it('announces a "status" message through the polite announcer region', () => {
    // Checked synchronously, right after render: the announcer clears its region 500ms after
    // writing it, so waiting here would race that timer.
    render(<StatusMessage id="s4" politeness="status" message="12 cities" />);
    expect(politeRegion()).toHaveTextContent('12 cities');
  });

  it('announces an "alert" message through the assertive announcer region', () => {
    render(<StatusMessage id="s5" politeness="alert" message="Couldn't load cities." />);
    expect(assertiveRegion()).toHaveTextContent("Couldn't load cities.");
  });

  it('does not re-announce identical text on re-render', () => {
    const { rerender } = render(
      <StatusMessage id="s6" politeness="status" message="12 cities" />,
    );
    expect(politeRegion()).toHaveTextContent('12 cities');
    politeRegion()!.textContent = ''; // simulate the announcer having cleared it after 500ms

    rerender(<StatusMessage id="s6" politeness="status" message="12 cities" />);
    // Same message, no new announcement — region stays cleared.
    expect(politeRegion()).toHaveTextContent('');
  });

  it('has no axe violations', async () => {
    const { container } = render(<StatusMessage id="s7" politeness="status" message="Loading…" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

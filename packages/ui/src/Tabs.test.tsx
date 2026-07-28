import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Tabs } from './Tabs';

const items = [
  { id: 'hourly', label: 'Hourly', content: <p>Hourly content</p> },
  { id: 'daily', label: 'Daily', content: <p>Daily content</p> },
];

describe('Tabs', () => {
  it('shows the first tab panel by default and exposes tablist/tab roles', () => {
    render(<Tabs label="Forecast range" items={items} />);
    expect(screen.getByRole('tablist', { name: 'Forecast range' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Hourly' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Hourly content')).toBeInTheDocument();
  });

  it('Right arrow moves to and activates the next tab (one sequential tab stop)', async () => {
    render(<Tabs label="Forecast range" items={items} />);
    const user = userEvent.setup();
    await user.tab(); // focuses the selected tab (Hourly) — the tablist's one tab stop
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Daily' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Daily content')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Tabs label="Forecast range" items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

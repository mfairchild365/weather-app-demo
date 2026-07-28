import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { CurrentConditions } from './CurrentConditions';

const OBSERVATION = {
  observedAt: '2026-07-27T12:00:00.000Z',
  temperature: 22.5,
  windSpeed: 8,
  windDirection: 270,
  humidity: 50,
  pressure: 1013,
  precipitation: 0,
  weatherCode: 1,
  weatherLabel: 'Mainly clear',
  weatherIconKey: 'mostly-clear',
  isDay: true,
};

describe('CurrentConditions', () => {
  it('shows the human-readable weather label, not a bare code (FR-004)', () => {
    render(<CurrentConditions observation={OBSERVATION} dataAsOf="2026-07-27T12:05:00.000Z" />);
    expect(screen.getByText('Mainly clear')).toBeInTheDocument();
    expect(screen.getByText('23°C')).toBeInTheDocument();
  });

  it('shows an explicit "no data yet" state instead of blank UI (Acceptance Scenario US2.2)', () => {
    render(<CurrentConditions observation={null} dataAsOf={null} />);
    expect(screen.getByText('No current conditions yet.')).toBeInTheDocument();
  });

  it('has no axe violations in either state', async () => {
    const { container, rerender } = render(
      <CurrentConditions observation={OBSERVATION} dataAsOf="2026-07-27T12:05:00.000Z" />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(<CurrentConditions observation={null} dataAsOf={null} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

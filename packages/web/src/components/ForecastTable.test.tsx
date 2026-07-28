import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ForecastTable } from './ForecastTable';

const HOURLY = Array.from({ length: 30 }, (_, index) => ({
  validAt: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
  temperature: 20 + index,
  windSpeed: 5,
  windDirection: 180,
  humidity: 50,
  precipitation: 0,
  precipitationProbability: 10,
  weatherCode: 1,
  weatherLabel: 'Mainly clear',
  weatherIconKey: 'mostly-clear',
  isDay: true,
}));

const DAILY = Array.from({ length: 7 }, (_, index) => ({
  validDate: new Date(Date.UTC(2026, 6, 27 + index)).toISOString().slice(0, 10),
  temperatureMin: 15,
  temperatureMax: 25,
  windSpeedMax: 10,
  precipitationSum: 0,
  precipitationProbabilityMax: 5,
  weatherCode: 1,
  weatherLabel: 'Mainly clear',
  weatherIconKey: 'mostly-clear',
  sunrise: null,
  sunset: null,
}));

afterEach(() => {
  vi.useRealTimers();
});

describe('ForecastTable', () => {
  it('caps the hourly view at the next 24 rows (spec FR-005)', () => {
    render(<ForecastTable cityName="Tokyo" range="hourly" hourlyRows={HOURLY} />);
    const table = screen.getByRole('table', { name: 'Tokyo hourly forecast' });
    expect(within(table).getAllByRole('row')).toHaveLength(25); // 1 header row + 24 data rows
  });

  it('shows all 7 daily rows', () => {
    render(<ForecastTable cityName="Tokyo" range="daily" dailyRows={DAILY} />);
    const table = screen.getByRole('table', { name: 'Tokyo daily forecast' });
    expect(within(table).getAllByRole('row')).toHaveLength(8);
  });

  it('never shows data only in the chart — the table has the same values (FR-006)', () => {
    render(<ForecastTable cityName="Tokyo" range="hourly" hourlyRows={HOURLY} />);
    const chart = document.querySelector('svg');
    expect(chart).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has no axe violations for either range', async () => {
    const { container, rerender } = render(
      <ForecastTable cityName="Tokyo" range="hourly" hourlyRows={HOURLY} />,
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(<ForecastTable cityName="Tokyo" range="daily" dailyRows={DAILY} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

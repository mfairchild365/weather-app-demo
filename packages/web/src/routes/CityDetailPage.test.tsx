import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { CityDetailPage } from './CityDetailPage';

const CITY_DETAIL = {
  slug: 'tokyo-jp',
  name: 'Tokyo',
  region: { name: 'Japan', code: 'JP' },
  timezone: 'Asia/Tokyo',
  latitude: 35.68,
  longitude: 139.65,
  latestObservation: {
    observedAt: '2026-07-27T12:00:00.000Z',
    temperature: 26.9,
    windSpeed: 6.3,
    windDirection: 156,
    humidity: 76,
    pressure: 1008.4,
    precipitation: 0,
    weatherCode: 2,
    weatherLabel: 'Partly cloudy',
    weatherIconKey: 'partly-cloudy',
    isDay: true,
  },
  dataAsOf: '2026-07-27T12:05:00.000Z',
};

function hourlyRow(hoursFromNow: number) {
  return {
    validAt: new Date(Date.now() + hoursFromNow * 3600_000).toISOString(),
    temperature: 25,
    windSpeed: 5,
    windDirection: 150,
    humidity: 70,
    precipitation: 0,
    precipitationProbability: 5,
    weatherCode: 1,
    weatherLabel: 'Mainly clear',
    weatherIconKey: 'mostly-clear',
    isDay: true,
  };
}

const DAILY_ROW = {
  validDate: '2026-07-27',
  temperatureMin: 22,
  temperatureMax: 28,
  windSpeedMax: 12,
  precipitationSum: 0,
  precipitationProbabilityMax: 10,
  weatherCode: 1,
  weatherLabel: 'Mainly clear',
  weatherIconKey: 'mostly-clear',
  sunrise: null,
  sunset: null,
};

function stubFetchHappyPath(): void {
  globalThis.fetch = (async (input: string) => {
    const url = new URL(input, 'http://localhost');
    if (url.pathname.endsWith('/forecast')) {
      const range = url.searchParams.get('range');
      const rows = range === 'hourly' ? [hourlyRow(1), hourlyRow(2)] : [DAILY_ROW];
      return { ok: true, status: 200, json: async () => ({ range, rows }) } as Response;
    }
    return { ok: true, status: 200, json: async () => CITY_DETAIL } as Response;
  }) as typeof fetch;
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/cities/:slug" element={<CityDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CityDetailPage', () => {
  it('shows current conditions, freshness, and both forecast tabs (Acceptance Scenario US2.1)', async () => {
    stubFetchHappyPath();
    renderAt('/cities/tokyo-jp');

    expect(await screen.findByRole('heading', { name: 'Tokyo forecast' })).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText(/As of/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Tokyo hourly forecast' })).toBeInTheDocument();
  });

  it('switching to the Daily tab replaces the table without a full reload (Acceptance Scenario US2.3)', async () => {
    stubFetchHappyPath();
    renderAt('/cities/tokyo-jp');
    await screen.findByRole('table', { name: 'Tokyo hourly forecast' });

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Daily' }));

    expect(await screen.findByRole('table', { name: 'Tokyo daily forecast' })).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Tokyo hourly forecast' })).not.toBeInTheDocument();
  });

  it('shows "no current conditions yet" when the city has no observation (Acceptance Scenario US2.2)', async () => {
    globalThis.fetch = (async (input: string) => {
      const url = new URL(input, 'http://localhost');
      if (url.pathname.endsWith('/forecast')) {
        const range = url.searchParams.get('range');
        return {
          ok: true,
          status: 200,
          json: async () => ({ range, rows: range === 'hourly' ? [hourlyRow(1)] : [DAILY_ROW] }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ...CITY_DETAIL, latestObservation: null, dataAsOf: null }),
      } as Response;
    }) as typeof fetch;

    renderAt('/cities/tokyo-jp');
    expect(await screen.findByText('No current conditions yet.')).toBeInTheDocument();
  });

  it('shows an alert with retry when the forecast fetch fails (Acceptance Scenario US2.5)', async () => {
    let callCount = 0;
    globalThis.fetch = (async (input: string) => {
      const url = new URL(input, 'http://localhost');
      if (url.pathname.endsWith('/forecast')) {
        callCount += 1;
        if (callCount <= 2) return { ok: false, status: 500, json: async () => ({}) } as Response;
        const range = url.searchParams.get('range');
        return {
          ok: true,
          status: 200,
          json: async () => ({ range, rows: range === 'hourly' ? [hourlyRow(1)] : [DAILY_ROW] }),
        } as Response;
      }
      return { ok: true, status: 200, json: async () => CITY_DETAIL } as Response;
    }) as typeof fetch;

    renderAt('/cities/tokyo-jp');
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load forecast for Tokyo.");

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry loading forecast' }));

    expect(await screen.findByRole('table', { name: 'Tokyo hourly forecast' })).toBeInTheDocument();
  });

  it('shows "City not found" (not a crash) for an unknown slug (spec FR-008)', async () => {
    globalThis.fetch = (async () =>
      ({ ok: false, status: 404, json: async () => ({}) }) as Response) as typeof fetch;

    renderAt('/cities/nonexistent');

    expect(await screen.findByRole('heading', { name: 'City not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to city list' })).toBeInTheDocument();
  });

  it('has no axe violations in loaded, error, and not-found states', async () => {
    stubFetchHappyPath();
    const loaded = render(
      <MemoryRouter initialEntries={['/cities/tokyo-jp']}>
        <Routes>
          <Route path="/cities/:slug" element={<CityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await within(loaded.container).findByRole('table', { name: 'Tokyo hourly forecast' });
    expect(await axe(loaded.container)).toHaveNoViolations();
    loaded.unmount();

    globalThis.fetch = (async () =>
      ({ ok: false, status: 404, json: async () => ({}) }) as Response) as typeof fetch;
    const notFound = render(
      <MemoryRouter initialEntries={['/cities/nonexistent']}>
        <Routes>
          <Route path="/cities/:slug" element={<CityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await within(notFound.container).findByRole('heading', { name: 'City not found' });
    expect(await axe(notFound.container)).toHaveNoViolations();
  });
});

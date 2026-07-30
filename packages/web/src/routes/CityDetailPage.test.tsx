import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { resetAnnouncer } from '@weather-demo/ui';
import { renderWithVisitorContext } from '../testing/renderWithVisitorContext';
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

const TOKYO_HOME_CITY = { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' };

function renderAt(path: string, options?: { homeCity?: typeof TOKYO_HOME_CITY }) {
  return renderWithVisitorContext(
    <Routes>
      <Route path="/cities/:slug" element={<CityDetailPage />} />
    </Routes>,
    { route: path, ...options },
  );
}

afterEach(() => {
  resetAnnouncer();
});

describe('CityDetailPage', () => {
  it('shows current conditions, freshness, and both forecast tabs (Acceptance Scenario US2.1)', async () => {
    stubFetchHappyPath();
    renderAt('/cities/tokyo-jp');

    expect(await screen.findByRole('heading', { name: 'Tokyo forecast' })).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText(/As of/)).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Tokyo hourly forecast' })).toBeInTheDocument();
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
    await waitFor(() =>
      expect(document.getElementById('city-detail-error')).toHaveTextContent(
        "The sky is not returning our calls. Couldn't load forecast for Tokyo.",
      ),
    );

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
    const loaded = renderAt('/cities/tokyo-jp');
    await within(loaded.container).findByRole('table', { name: 'Tokyo hourly forecast' });
    expect(await axe(loaded.container)).toHaveNoViolations();
    loaded.unmount();

    globalThis.fetch = (async () =>
      ({ ok: false, status: 404, json: async () => ({}) }) as Response) as typeof fetch;
    const notFound = renderAt('/cities/nonexistent');
    await within(notFound.container).findByRole('heading', { name: 'City not found' });
    expect(await axe(notFound.container)).toHaveNoViolations();
  });

  it('has no axe violations with the home-city toggle pressed', async () => {
    stubFetchHappyPath();
    const { container } = renderAt('/cities/tokyo-jp', { homeCity: TOKYO_HOME_CITY });
    await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('home-city pin (spec 006)', () => {
    afterEach(() => {
      resetAnnouncer();
    });

    it('the toggle is unpressed by default and named for the current city', async () => {
      stubFetchHappyPath();
      renderAt('/cities/tokyo-jp');
      const toggle = await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('the toggle is pressed on load when this city is already the pinned home city', async () => {
      stubFetchHappyPath();
      renderAt('/cities/tokyo-jp', { homeCity: TOKYO_HOME_CITY });
      const toggle = await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('pinning announces confirmation, persists to the store, and flips aria-pressed', async () => {
      stubFetchHappyPath();
      const { store } = renderAt('/cities/tokyo-jp');
      const toggle = await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });

      const user = userEvent.setup();
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      expect(store.read().homeCity).toEqual(TOKYO_HOME_CITY);
      // The announcer serializes messages behind the loading announcement already queued at
      // mount (500ms display + 100ms gap, real timers) — wait for it to surface rather than
      // asserting immediately.
      await waitFor(
        () =>
          expect(document.querySelector('[data-announcer="polite"]')).toHaveTextContent(
            'Tokyo, Japan is now your home city. Noted.',
          ),
        { timeout: 2000 },
      );
    });

    it('the visible label stays "Home city" whether pressed or not', async () => {
      stubFetchHappyPath();
      renderAt('/cities/tokyo-jp');
      const toggle = await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
      expect(toggle).toHaveTextContent('Home city');

      const user = userEvent.setup();
      await user.click(toggle);
      expect(toggle).toHaveTextContent('Home city');
    });

    it('unpinning announces confirmation and clears the store', async () => {
      stubFetchHappyPath();
      const { store } = renderAt('/cities/tokyo-jp', { homeCity: TOKYO_HOME_CITY });
      const toggle = await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
      expect(toggle).toHaveAttribute('aria-pressed', 'true');

      const user = userEvent.setup();
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(store.read().homeCity).toBeNull();
      await waitFor(
        () =>
          expect(document.querySelector('[data-announcer="polite"]')).toHaveTextContent(
            'Tokyo, Japan is no longer your home city.',
          ),
        { timeout: 2000 },
      );
    });

    it('a 404 for the pinned city\'s own slug clears the pin and announces why (FR-009)', async () => {
      globalThis.fetch = (async () =>
        ({ ok: false, status: 404, json: async () => ({}) }) as Response) as typeof fetch;
      const { store } = renderAt('/cities/tokyo-jp', { homeCity: TOKYO_HOME_CITY });

      await screen.findByRole('heading', { name: 'City not found' });
      await waitFor(() => expect(store.read().homeCity).toBeNull());
      await waitFor(
        () =>
          expect(document.querySelector('[data-announcer="polite"]')).toHaveTextContent(
            'Tokyo, Japan is no longer available. Home city cleared.',
          ),
        { timeout: 2000 },
      );
    });

    it('a transient forecast error does not touch an unrelated pinned city', async () => {
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

      const { store } = renderAt('/cities/tokyo-jp', { homeCity: TOKYO_HOME_CITY });
      await waitFor(() =>
        expect(document.getElementById('city-detail-error')).toHaveTextContent(/./),
      );
      expect(store.read().homeCity).toEqual(TOKYO_HOME_CITY);
    });

    it('reconciles a stale cached name once fresh data loads, without announcing', async () => {
      stubFetchHappyPath();
      const staleCached = { slug: 'tokyo-jp', name: 'Old Tokyo Name', regionName: 'Japan' };
      const { store } = renderAt('/cities/tokyo-jp', { homeCity: staleCached });

      await screen.findByRole('button', { name: 'Home city: Tokyo, Japan' });
      await waitFor(() =>
        expect(store.read().homeCity).toEqual({
          slug: 'tokyo-jp',
          name: 'Tokyo',
          regionName: 'Japan',
        }),
      );
      // The reconcile itself never calls announce(); the only message that ever enters the
      // queue is the transient "Consulting the sky…" loading announcement, which clears itself
      // once its display window elapses. Waiting for the region to go empty (rather than
      // asserting immediately) confirms the reconcile added nothing further to the queue.
      await waitFor(
        () => expect(document.querySelector('[data-announcer="polite"]')).toBeEmptyDOMElement(),
        { timeout: 2000 },
      );
    });
  });
});

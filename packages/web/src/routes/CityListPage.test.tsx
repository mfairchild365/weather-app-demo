import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { resetAnnouncer } from '@weather-demo/ui';
import { renderWithVisitorContext } from '../testing/renderWithVisitorContext';
import { CityListPage } from './CityListPage';

const CITIES = [
  { slug: 'tokyo-jp', name: 'Tokyo', region: { name: 'Japan', code: 'JP' } },
  { slug: 'toledo-us', name: 'Toledo', region: { name: 'United States', code: 'US' } },
  { slug: 'london-gb', name: 'London', region: { name: 'United Kingdom', code: 'GB' } },
];

const TOLEDO_HOME_CITY = { slug: 'toledo-us', name: 'Toledo', regionName: 'United States' };

function stubFetchSuccess(): void {
  globalThis.fetch = (async () =>
    ({ ok: true, status: 200, json: async () => CITIES }) as Response) as typeof fetch;
}

function renderPage(options?: { homeCity?: typeof TOLEDO_HOME_CITY }) {
  return renderWithVisitorContext(<CityListPage />, options);
}

afterEach(() => {
  vi.useRealTimers();
  resetAnnouncer();
});

describe('CityListPage', () => {
  it('lists every city as a link naming the city and its region (Acceptance Scenario US1.1)', async () => {
    stubFetchSuccess();
    renderPage();
    expect(await screen.findByRole('link', { name: 'Tokyo, Japan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Toledo, United States' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'London, United Kingdom' })).toBeInTheDocument();
  });

  it('filters the list as the visitor types, with no extra network request (US1.2)', async () => {
    const fetchMock = vi.fn(
      async () => ({ ok: true, status: 200, json: async () => CITIES }) as Response,
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    renderPage();
    await screen.findByRole('link', { name: 'Tokyo, Japan' });

    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'tok');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Tokyo, Japan' })).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'London, United Kingdom' }),
      ).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a "no matches" message when nothing matches (US1.3)', async () => {
    stubFetchSuccess();
    renderPage();
    await screen.findByRole('link', { name: 'Tokyo, Japan' });

    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'zzz');

    await waitFor(() =>
      expect(document.getElementById('city-list-status')).toHaveTextContent(
        'Nothing matched "zzz". Bold search. Zero results.',
      ),
    );
  });

  it('announces a dry line instead of the generic message for the "xyzzy" easter egg (FR-010)', async () => {
    stubFetchSuccess();
    renderPage();
    await screen.findByRole('link', { name: 'Tokyo, Japan' });

    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'xyzzy');

    await waitFor(() =>
      expect(document.getElementById('city-list-status')).toHaveTextContent(
        'Nothing here. You knew that.',
      ),
    );
  });

  it('announces a dry line instead of the generic message for the "atlantis" easter egg (FR-010)', async () => {
    stubFetchSuccess();
    renderPage();
    await screen.findByRole('link', { name: 'Tokyo, Japan' });

    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'Atlantis');

    await waitFor(() =>
      expect(document.getElementById('city-list-status')).toHaveTextContent(
        'Submerged. Forecast unavailable.',
      ),
    );
  });

  it('shows an alert with a working retry action when the fetch fails', async () => {
    let callCount = 0;
    globalThis.fetch = (async () => {
      callCount += 1;
      if (callCount === 1) return { ok: false, status: 500, json: async () => ({}) } as Response;
      return { ok: true, status: 200, json: async () => CITIES } as Response;
    }) as typeof fetch;

    renderPage();
    await waitFor(() =>
      expect(document.getElementById('city-list-error')).toHaveTextContent(
        "The sky is not returning our calls. Couldn't load cities.",
      ),
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry loading cities' }));

    expect(await screen.findByRole('link', { name: 'Tokyo, Japan' })).toBeInTheDocument();
  });

  it('has no axe violations in the default, filtered, empty-result, and error states', async () => {
    stubFetchSuccess();
    const { container, unmount } = renderPage();
    await screen.findByRole('link', { name: 'Tokyo, Japan' });
    expect(await axe(container)).toHaveNoViolations();
    unmount();

    globalThis.fetch = (async () =>
      ({ ok: false, status: 500, json: async () => ({}) }) as Response) as typeof fetch;
    const errorRender = renderPage();
    await waitFor(() => expect(document.getElementById('city-list-error')).toHaveTextContent(/./));
    expect(await axe(errorRender.container)).toHaveNoViolations();
  });

  describe('pinned home city (spec 006)', () => {
    it('sorts the pinned city first and marks it in the link text', async () => {
      stubFetchSuccess();
      renderPage({ homeCity: TOLEDO_HOME_CITY });
      await screen.findByRole('link', { name: 'Toledo, United States (home city)' });

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAccessibleName('Toledo, United States (home city)');
    });

    it('does not reintroduce the pinned city when the search filter excludes it', async () => {
      stubFetchSuccess();
      renderPage({ homeCity: TOLEDO_HOME_CITY });
      await screen.findByRole('link', { name: 'Toledo, United States (home city)' });

      const user = userEvent.setup();
      await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'tokyo');

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Tokyo, Japan' })).toBeInTheDocument();
        expect(
          screen.queryByRole('link', { name: /Toledo, United States/ }),
        ).not.toBeInTheDocument();
      });
    });

    it('does not change the debounced count message', async () => {
      stubFetchSuccess();
      renderPage({ homeCity: TOLEDO_HOME_CITY });
      await screen.findByRole('link', { name: 'Toledo, United States (home city)' });
      await waitFor(() =>
        expect(document.getElementById('city-list-status')).toHaveTextContent('3 cities'),
      );
    });

    it('has no axe violations with a city pinned', async () => {
      stubFetchSuccess();
      const { container } = renderPage({ homeCity: TOLEDO_HOME_CITY });
      await screen.findByRole('link', { name: 'Toledo, United States (home city)' });
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

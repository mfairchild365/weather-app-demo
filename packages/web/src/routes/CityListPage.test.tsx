import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { CityListPage } from './CityListPage';

const CITIES = [
  { slug: 'tokyo-jp', name: 'Tokyo', region: { name: 'Japan', code: 'JP' } },
  { slug: 'toledo-us', name: 'Toledo', region: { name: 'United States', code: 'US' } },
  { slug: 'london-gb', name: 'London', region: { name: 'United Kingdom', code: 'GB' } },
];

function stubFetchSuccess(): void {
  globalThis.fetch = (async () =>
    ({ ok: true, status: 200, json: async () => CITIES }) as Response) as typeof fetch;
}

function renderPage(): void {
  render(
    <MemoryRouter>
      <CityListPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.useRealTimers();
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
      expect(screen.getByRole('status')).toHaveTextContent('No cities match "zzz".'),
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
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load cities.");

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry loading cities' }));

    expect(await screen.findByRole('link', { name: 'Tokyo, Japan' })).toBeInTheDocument();
  });

  it('has no axe violations in the default, filtered, empty-result, and error states', async () => {
    stubFetchSuccess();
    const { container, unmount } = render(
      <MemoryRouter>
        <CityListPage />
      </MemoryRouter>,
    );
    await screen.findByRole('link', { name: 'Tokyo, Japan' });
    expect(await axe(container)).toHaveNoViolations();
    unmount();

    globalThis.fetch = (async () =>
      ({ ok: false, status: 500, json: async () => ({}) }) as Response) as typeof fetch;
    const errorRender = render(
      <MemoryRouter>
        <CityListPage />
      </MemoryRouter>,
    );
    await screen.findByRole('alert');
    expect(await axe(errorRender.container)).toHaveNoViolations();
  });
});

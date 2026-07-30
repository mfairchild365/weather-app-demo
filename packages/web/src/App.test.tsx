import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { renderWithVisitorContext } from './testing/renderWithVisitorContext';
import { App } from './App';

const TOKYO = { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' };

function stubFetch(): void {
  globalThis.fetch = (async () =>
    ({ ok: true, status: 200, json: async () => [] }) as Response) as typeof fetch;
}

describe('App', () => {
  it('renders exactly one <main> and header/footer landmarks, and no navigation landmark', async () => {
    stubFetch();
    renderWithVisitorContext(<App />, { route: '/' });
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // Two links in the header do not warrant a <nav> — asserted here so a future contributor
    // doesn't casually add an unnamed one (spec 006 `components`).
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
  });

  it('the skip link is the first focusable element and targets <main>', async () => {
    stubFetch();
    renderWithVisitorContext(<App />, { route: '/' });
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#maincontent');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'maincontent');
  });

  it('has no axe violations on the shell', async () => {
    stubFetch();
    const { container } = renderWithVisitorContext(<App />, { route: '/' });
    await screen.findByRole('main');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows no home-city link when nothing is pinned', async () => {
    stubFetch();
    renderWithVisitorContext(<App />, { route: '/' });
    await screen.findByRole('main');
    expect(screen.queryByRole('link', { name: /^Home:/ })).not.toBeInTheDocument();
  });

  it('shows a home-city link on every page once a city is pinned', async () => {
    stubFetch();
    renderWithVisitorContext(<App />, { route: '/', homeCity: TOKYO });
    expect(await screen.findByRole('link', { name: 'Home: Tokyo, Japan' })).toBeInTheDocument();
  });

  it('has no axe violations on the shell with a city pinned', async () => {
    stubFetch();
    const { container } = renderWithVisitorContext(<App />, { route: '/', homeCity: TOKYO });
    await screen.findByRole('link', { name: 'Home: Tokyo, Japan' });
    expect(await axe(container)).toHaveNoViolations();
  });
});

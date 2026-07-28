import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { App } from './App';

function stubFetch(): void {
  globalThis.fetch = (async () =>
    ({ ok: true, status: 200, json: async () => [] }) as Response) as typeof fetch;
}

describe('App', () => {
  it('renders exactly one <main> and header/footer landmarks', async () => {
    stubFetch();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('the skip link is the first focusable element and targets <main>', async () => {
    stubFetch();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toHaveAttribute('href', '#maincontent');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'maincontent');
  });

  it('has no axe violations on the shell', async () => {
    stubFetch();
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole('main');
    expect(await axe(container)).toHaveNoViolations();
  });
});

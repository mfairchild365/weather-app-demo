import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { useRef } from 'react';
import { useFocusMainOnRouteChange } from './useFocusMainOnRouteChange';

function Page({ heading }: { heading: string }) {
  const mainRef = useRef<HTMLElement | null>(null);
  useFocusMainOnRouteChange(mainRef);
  return (
    <main ref={mainRef} tabIndex={-1}>
      <h1>{heading}</h1>
      <Link to="/other">Go</Link>
    </main>
  );
}

describe('useFocusMainOnRouteChange', () => {
  it('moves focus to <main> after a client-side route change (spec FR-010)', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Page heading="Home" />} />
          <Route path="/other" element={<Page heading="Other" />} />
        </Routes>
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Go' }));

    expect(await screen.findByRole('heading', { name: 'Other' })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByText('Other').closest('main'));
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('shows a heading and a link back to the city list, not a crash', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to city list' })).toHaveAttribute('href', '/');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { renderWithVisitorContext } from '../testing/renderWithVisitorContext';
import { HomeCityLink } from './HomeCityLink';

const TOKYO = { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' };

describe('HomeCityLink', () => {
  it('renders nothing when no home city is pinned', () => {
    const { container } = renderWithVisitorContext(<HomeCityLink />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link naming the pinned city and region', () => {
    renderWithVisitorContext(<HomeCityLink />, { homeCity: TOKYO });
    const link = screen.getByRole('link', { name: 'Home: Tokyo, Japan' });
    expect(link).toHaveAttribute('href', '/cities/tokyo-jp');
  });

  it('the decorative star is aria-hidden, so it is not part of the accessible name', () => {
    renderWithVisitorContext(<HomeCityLink />, { homeCity: TOKYO });
    const link = screen.getByRole('link', { name: 'Home: Tokyo, Japan' });
    const star = link.querySelector('[aria-hidden="true"]');
    expect(star).not.toBeNull();
    expect(star).toHaveTextContent('★');
  });

  it('carries aria-current="page" when already on the pinned city\'s page', () => {
    renderWithVisitorContext(
      <Routes>
        <Route path="/cities/:slug" element={<HomeCityLink />} />
      </Routes>,
      { route: '/cities/tokyo-jp', homeCity: TOKYO },
    );
    expect(screen.getByRole('link', { name: 'Home: Tokyo, Japan' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('has no aria-current on a different page', () => {
    renderWithVisitorContext(<HomeCityLink />, { route: '/', homeCity: TOKYO });
    expect(screen.getByRole('link', { name: 'Home: Tokyo, Japan' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithVisitorContext(<HomeCityLink />, { homeCity: TOKYO });
    expect(await axe(container)).toHaveNoViolations();
  });
});

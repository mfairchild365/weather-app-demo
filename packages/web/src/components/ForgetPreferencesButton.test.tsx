import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { resetAnnouncer } from '@weather-demo/ui';
import { renderWithVisitorContext } from '../testing/renderWithVisitorContext';
import { ForgetPreferencesButton } from './ForgetPreferencesButton';

const TOKYO = { slug: 'tokyo-jp', name: 'Tokyo', regionName: 'Japan' };

afterEach(() => {
  resetAnnouncer();
});

describe('ForgetPreferencesButton', () => {
  it('is rendered and enabled even when nothing is pinned', () => {
    renderWithVisitorContext(<ForgetPreferencesButton />);
    const button = screen.getByRole('button', { name: 'Forget my saved preferences' });
    expect(button).toBeEnabled();
  });

  it('is rendered and enabled when something is pinned', () => {
    renderWithVisitorContext(<ForgetPreferencesButton />, { homeCity: TOKYO });
    expect(screen.getByRole('button', { name: 'Forget my saved preferences' })).toBeEnabled();
  });

  it('clears the store when something was pinned', async () => {
    const { store } = renderWithVisitorContext(<ForgetPreferencesButton />, { homeCity: TOKYO });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forget my saved preferences' }));
    expect(store.read().homeCity).toBeNull();
  });

  it('announces confirmation when something was cleared', async () => {
    renderWithVisitorContext(<ForgetPreferencesButton />, { homeCity: TOKYO });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forget my saved preferences' }));
    await waitFor(() =>
      expect(document.querySelector('[data-announcer="polite"]')).toHaveTextContent(
        'Saved preferences forgotten. Clean slate.',
      ),
    );
  });

  it('announces "nothing to forget" when nothing was pinned, rather than doing nothing silently', async () => {
    renderWithVisitorContext(<ForgetPreferencesButton />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forget my saved preferences' }));
    await waitFor(() =>
      expect(document.querySelector('[data-announcer="polite"]')).toHaveTextContent(
        'Nothing saved to forget.',
      ),
    );
  });

  it('keeps focus on the button after activation', async () => {
    renderWithVisitorContext(<ForgetPreferencesButton />, { homeCity: TOKYO });
    const button = screen.getByRole('button', { name: 'Forget my saved preferences' });
    const user = userEvent.setup();
    await user.click(button);
    expect(button).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithVisitorContext(<ForgetPreferencesButton />, {
      homeCity: TOKYO,
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { Button } from './Button';

describe('Button', () => {
  it('renders a native button with the given accessible name', () => {
    render(<Button>Retry loading cities</Button>);
    expect(screen.getByRole('button', { name: 'Retry loading cities' })).toBeInTheDocument();
  });

  it('is keyboard-activatable', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Retry</Button>);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Button>Retry</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

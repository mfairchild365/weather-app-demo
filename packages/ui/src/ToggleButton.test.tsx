import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  it('renders as a button with aria-pressed reflecting isSelected', () => {
    render(<ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('composes the accessible name as "<label>: <qualifier>", containing the visible label verbatim', () => {
    render(<ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} />);
    const button = screen.getByRole('button', { name: 'Home city: Tokyo, Japan' });
    // Explicit assertion, not solely relying on axe: WCAG 2.5.3 name-in-name is not covered by
    // this project's axe ruleset (label-content-name-mismatch is experimental and off by
    // default), so the containment must be asserted directly.
    expect(button.getAttribute('aria-label')).toContain('Home city');
  });

  it('keeps the visible label text identical across pressed and unpressed states', () => {
    const { rerender } = render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Home city');

    rerender(<ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Home city');
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no aria-label when no qualifier is given, so visible text is the accessible name', () => {
    render(<ToggleButton label="Home city" isSelected={false} />);
    expect(screen.getByRole('button', { name: 'Home city' })).not.toHaveAttribute('aria-label');
  });

  it('toggles isSelected via onChange on click', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} onChange={onChange} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles via the Enter key', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} onChange={onChange} />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles via the Space key', async () => {
    const onChange = vi.fn();
    render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} onChange={onChange} />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders renderIcon output as aria-hidden decoration', () => {
    render(
      <ToggleButton
        label="Home city"
        qualifier="Tokyo, Japan"
        isSelected={true}
        renderIcon={(selected) => (selected ? '★' : '☆')}
      />,
    );
    const button = screen.getByRole('button');
    const icon = button.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveTextContent('★');
  });

  it('has no axe violations when unpressed', async () => {
    const { container } = render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={false} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when pressed', async () => {
    const { container } = render(
      <ToggleButton label="Home city" qualifier="Tokyo, Japan" isSelected={true} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

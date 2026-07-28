import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('has an accessible name from its visible label', () => {
    render(<SearchField label="Search cities" />);
    expect(screen.getByRole('searchbox', { name: 'Search cities' })).toBeInTheDocument();
  });

  it('calls onChange as the visitor types', async () => {
    const onChange = vi.fn();
    render(<SearchField label="Search cities" onChange={onChange} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search cities' }), 'tok');
    expect(onChange).toHaveBeenLastCalledWith('tok');
  });

  it('the clear button empties the field and returns focus to the input', async () => {
    render(<SearchField label="Search cities" defaultValue="tok" />);
    const user = userEvent.setup();
    const input = screen.getByRole('searchbox', { name: 'Search cities' });
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SearchField label="Search cities" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

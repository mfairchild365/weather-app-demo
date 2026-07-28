import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Table, TableRow, TableCell, TableRowHeader } from './Table';

describe('Table', () => {
  it('names itself via a required caption and uses <th scope="col"> for headers', () => {
    render(
      <Table caption="Portland hourly forecast" columns={['Time', 'Temperature']}>
        <TableRow>
          <TableRowHeader>1pm</TableRowHeader>
          <TableCell>24°C</TableCell>
        </TableRow>
      </Table>,
    );
    const table = screen.getByRole('table', { name: 'Portland hourly forecast' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['Time', 'Temperature']);
    expect(headers[0]).toHaveAttribute('scope', 'col');
  });

  it('marks the first cell of each row as a <th scope="row"> row header', () => {
    render(
      <Table caption="Portland hourly forecast" columns={['Time', 'Temperature']}>
        <TableRow>
          <TableRowHeader>1pm</TableRowHeader>
          <TableCell>24°C</TableCell>
        </TableRow>
      </Table>,
    );
    const table = screen.getByRole('table', { name: 'Portland hourly forecast' });
    const rowHeader = within(table).getByRole('rowheader', { name: '1pm' });
    expect(rowHeader.tagName).toBe('TH');
    expect(rowHeader).toHaveAttribute('scope', 'row');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Table caption="Portland hourly forecast" columns={['Time', 'Temperature']}>
        <TableRow>
          <TableRowHeader>1pm</TableRowHeader>
          <TableCell>24°C</TableCell>
        </TableRow>
      </Table>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

import { Table, TableRow, TableCell, SparklineChart } from '@weather-demo/ui';
import type { ForecastHourlyRow, ForecastDailyRow } from '../lib/api-client';

export interface ForecastTableProps {
  cityName: string;
  range: 'hourly' | 'daily';
  hourlyRows?: ForecastHourlyRow[];
  dailyRows?: ForecastDailyRow[];
}

function formatHour(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', weekday: 'short' }).format(
    new Date(iso),
  );
}

function formatDay(dateOnly: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateOnly}T00:00:00Z`));
}

/** spec FR-005/FR-006: Hourly capped at the next 24 rows; Daily shows all 7. Decorative chart
 * paired with the always-visible table — the table is the sole source of truth for the data. */
export function ForecastTable({
  cityName,
  range,
  hourlyRows = [],
  dailyRows = [],
}: ForecastTableProps) {
  if (range === 'hourly') {
    const now = Date.now();
    const upcoming = hourlyRows.filter((row) => new Date(row.validAt).getTime() >= now);
    const rows = (upcoming.length > 0 ? upcoming : hourlyRows).slice(0, 24);

    return (
      <div>
        <SparklineChart values={rows.map((row) => row.temperature)} className="mb-2" />
        <Table
          caption={`${cityName} hourly forecast`}
          columns={['Time', 'Temp (°C)', 'Conditions', 'Precip. chance']}
        >
          {rows.map((row) => (
            <TableRow key={row.validAt}>
              <TableCell>{formatHour(row.validAt)}</TableCell>
              <TableCell>{Math.round(row.temperature)}</TableCell>
              <TableCell>{row.weatherLabel}</TableCell>
              <TableCell>
                {row.precipitationProbability === null
                  ? '—'
                  : `${Math.round(row.precipitationProbability)}%`}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    );
  }

  return (
    <div>
      <SparklineChart values={dailyRows.map((row) => row.temperatureMax)} className="mb-2" />
      <Table
        caption={`${cityName} daily forecast`}
        columns={['Day', 'High (°C)', 'Low (°C)', 'Conditions']}
      >
        {dailyRows.map((row) => (
          <TableRow key={row.validDate}>
            <TableCell>{formatDay(row.validDate)}</TableCell>
            <TableCell>{Math.round(row.temperatureMax)}</TableCell>
            <TableCell>{Math.round(row.temperatureMin)}</TableCell>
            <TableCell>{row.weatherLabel}</TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}

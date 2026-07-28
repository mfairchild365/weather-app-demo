import {
  Table,
  TableRow,
  TableCell,
  TableRowHeader,
  SparklineChart,
  WeatherIcon,
} from '@weather-demo/ui';
import type { ForecastHourlyRow, ForecastDailyRow } from '../lib/api-client';

/** spec 004 FR-004: decorative icon beside the existing weatherLabel text — the label remains the
 * sole accessible source of the condition (FR-005). */
function ConditionCell({ iconKey, label }: { iconKey: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <WeatherIcon iconKey={iconKey} className="h-5 w-5 shrink-0" />
      {label}
    </span>
  );
}

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

/** spec FR-005/FR-006: Hourly capped at the next 24 rows; Daily shows all 7. The chart's exact
 * values live only in the always-visible table — its accessible name just points there. */
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
        <SparklineChart
          values={rows.map((row) => row.temperature)}
          label={`Chart of ${cityName} hourly temperature, data in table below`}
          className="mb-2"
        />
        <Table
          caption={`${cityName} hourly forecast`}
          columns={['Time', 'Temp (°C)', 'Conditions', 'Precip. chance']}
        >
          {rows.map((row) => (
            <TableRow key={row.validAt}>
              <TableRowHeader>{formatHour(row.validAt)}</TableRowHeader>
              <TableCell>{Math.round(row.temperature)}</TableCell>
              <TableCell>
                <ConditionCell iconKey={row.weatherIconKey} label={row.weatherLabel} />
              </TableCell>
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
      <SparklineChart
        values={dailyRows.map((row) => row.temperatureMax)}
        label={`Chart of ${cityName} daily high temperature, data in table below`}
        className="mb-2"
      />
      <Table
        caption={`${cityName} daily forecast`}
        columns={['Day', 'High (°C)', 'Low (°C)', 'Conditions']}
      >
        {dailyRows.map((row) => (
          <TableRow key={row.validDate}>
            <TableRowHeader>{formatDay(row.validDate)}</TableRowHeader>
            <TableCell>{Math.round(row.temperatureMax)}</TableCell>
            <TableCell>{Math.round(row.temperatureMin)}</TableCell>
            <TableCell>
              <ConditionCell iconKey={row.weatherIconKey} label={row.weatherLabel} />
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}

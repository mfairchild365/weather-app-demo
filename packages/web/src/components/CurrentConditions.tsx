import { WeatherIcon } from '@weather-demo/ui';
import type { Observation } from '../lib/api-client';
import { getVerdict } from '../lib/verdict';
import { copy } from '../copy';

export interface CurrentConditionsProps {
  observation: Observation | null;
  dataAsOf: string | null;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/** spec FR-004: real weatherLabel, never a bare code; explicit "no data yet" state. spec 004
 * FR-004/FR-009: a decorative WeatherIcon paired with the label, plus a deterministic "verdict"
 * line rendered as plain static content (never a live region — see spec 004 Acceptance Scenario
 * US3.2). */
export function CurrentConditions({ observation, dataAsOf }: CurrentConditionsProps) {
  if (!observation) {
    return <p className="text-[var(--color-muted-text)]">{copy.noObservation}</p>;
  }

  return (
    <div className="mb-6">
      <p className="text-4xl font-bold">{Math.round(observation.temperature)}°C</p>
      <p className="flex items-center gap-2 text-lg">
        <WeatherIcon iconKey={observation.weatherIconKey} className="h-6 w-6" />
        {observation.weatherLabel}
      </p>
      <p className="text-[var(--color-muted-text)]">
        {getVerdict({
          temperature: observation.temperature,
          iconKey: observation.weatherIconKey,
          isDay: observation.isDay,
        })}
      </p>
      {dataAsOf && (
        <p className="text-sm text-[var(--color-muted-text)]">As of {formatDateTime(dataAsOf)}</p>
      )}
    </div>
  );
}

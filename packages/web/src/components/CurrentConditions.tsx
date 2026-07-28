import type { Observation } from '../lib/api-client';

export interface CurrentConditionsProps {
  observation: Observation | null;
  dataAsOf: string | null;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/** spec FR-004: real weatherLabel, never a bare code; explicit "no data yet" state. */
export function CurrentConditions({ observation, dataAsOf }: CurrentConditionsProps) {
  if (!observation) {
    return <p className="text-[var(--color-muted-text)]">No current conditions yet.</p>;
  }

  return (
    <div className="mb-6">
      <p className="text-4xl font-bold">{Math.round(observation.temperature)}°C</p>
      <p className="text-lg">{observation.weatherLabel}</p>
      {dataAsOf && (
        <p className="text-sm text-[var(--color-muted-text)]">As of {formatDateTime(dataAsOf)}</p>
      )}
    </div>
  );
}

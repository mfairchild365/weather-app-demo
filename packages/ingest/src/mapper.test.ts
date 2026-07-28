import { describe, it, expect } from 'vitest';
import fixture from './__fixtures__/open-meteo-response.json' with { type: 'json' };
import { openMeteoResponseSchema } from './open-meteo-schema';
import { mapObservation, mapForecastHourly, mapForecastDaily } from './mapper';

const response = openMeteoResponseSchema.parse(fixture);
const city = { id: 42 };
const ingestRunId = 7;

describe('mapObservation', () => {
  it('maps current conditions into an observation row with a UTC observed_at', () => {
    const row = mapObservation(response, city, ingestRunId);
    expect(row.cityId).toBe(42);
    expect(row.ingestRunId).toBe(7);
    expect(row.observedAt.toISOString()).toBe('2026-07-27T12:00:00.000Z');
    expect(row.temperature).toBe('24.30');
    expect(row.weatherCode).toBe(1);
    expect(row.isDay).toBe(true);
  });
});

describe('mapForecastHourly', () => {
  it('maps one row per hour Open-Meteo returned, in order', () => {
    const rows = mapForecastHourly(response, city, ingestRunId);
    expect(rows).toHaveLength(4);
    expect(rows[0]?.validAt.toISOString()).toBe('2026-07-27T12:00:00.000Z');
    expect(rows[3]?.validAt.toISOString()).toBe('2026-07-27T15:00:00.000Z');
    expect(rows[3]?.precipitationProbability).toBe('15.00');
    expect(rows[2]?.weatherCode).toBe(2);
  });
});

describe('mapForecastDaily', () => {
  it('maps one row per day Open-Meteo returned, in order', () => {
    const rows = mapForecastDaily(response, city, ingestRunId);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.validDate).toBe('2026-07-27');
    expect(rows[0]?.temperatureMax).toBe('26.10');
    expect(rows[0]?.sunrise?.toISOString()).toBe('2026-07-27T13:24:00.000Z');
    expect(rows[2]?.validDate).toBe('2026-07-29');
  });
});

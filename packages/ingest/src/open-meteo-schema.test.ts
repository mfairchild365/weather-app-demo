import { describe, it, expect } from 'vitest';
import fixture from './__fixtures__/open-meteo-response.json' with { type: 'json' };
import { openMeteoResponseSchema } from './open-meteo-schema';

describe('openMeteoResponseSchema', () => {
  it('parses a well-formed Open-Meteo response', () => {
    const result = openMeteoResponseSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('rejects a response missing required fields', () => {
    const malformed = { latitude: 1, longitude: 2, current: {}, hourly: {}, daily: {} };
    const result = openMeteoResponseSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('rejects a response with the wrong type for a field (weather_code as string)', () => {
    const malformed = JSON.parse(JSON.stringify(fixture)) as Record<string, unknown>;
    (malformed['current'] as Record<string, unknown>)['weather_code'] = 'not-a-number';
    const result = openMeteoResponseSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});

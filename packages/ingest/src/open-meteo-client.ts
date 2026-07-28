import { openMeteoResponseSchema, type OpenMeteoResponse } from './open-meteo-schema';

export interface ForecastTarget {
  latitude: string;
  longitude: string;
}

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'is_day',
  'precipitation',
  'weather_code',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
].join(',');

const HOURLY_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'is_day',
].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
].join(',');

export class OpenMeteoFetchError extends Error {}

function buildUrl(target: ForecastTarget): string {
  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set('latitude', target.latitude);
  url.searchParams.set('longitude', target.longitude);
  url.searchParams.set('current', CURRENT_FIELDS);
  url.searchParams.set('hourly', HOURLY_FIELDS);
  url.searchParams.set('daily', DAILY_FIELDS);
  url.searchParams.set('forecast_days', '7');
  // Requested in UTC regardless of the city's own timezone, so every timestamp in the response is
  // an unambiguous instant — see open-meteo-schema.ts.
  url.searchParams.set('timezone', 'UTC');
  return url.toString();
}

/**
 * Fetches and validates one city's current conditions + hourly + daily forecast. Throws
 * `OpenMeteoFetchError` on a network failure, non-2xx response, or a response shape that doesn't
 * validate — callers (cycle.ts) treat all three the same way: skip this city, record why, move on
 * (spec FR-005).
 */
export async function fetchForecast(target: ForecastTarget): Promise<OpenMeteoResponse> {
  const url = buildUrl(target);
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new OpenMeteoFetchError(
      `Network error fetching Open-Meteo forecast: ${(error as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new OpenMeteoFetchError(
      `Open-Meteo returned ${response.status} ${response.statusText} for ${url}`,
    );
  }

  const body: unknown = await response.json();
  const result = openMeteoResponseSchema.safeParse(body);
  if (!result.success) {
    throw new OpenMeteoFetchError(`Open-Meteo response failed validation: ${result.error.message}`);
  }
  return result.data;
}

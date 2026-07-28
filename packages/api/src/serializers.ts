import type {
  CityWithRegion,
  ObservationRow,
  ForecastHourlyRow,
  ForecastDailyRow,
} from '@weather-demo/db';

/**
 * Repository rows store numeric columns as strings (Postgres `numeric` -> driver string) and
 * dates as `Date` objects. These functions convert to the plain numbers / ISO strings the API's
 * zod schemas (schemas.ts) describe — the one place that conversion happens, so route handlers
 * don't each re-derive it.
 */

function toNumberOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}

export function serializeCity(city: CityWithRegion) {
  return {
    slug: city.slug,
    name: city.name,
    region: city.region,
    timezone: city.timezone,
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
  };
}

export function serializeObservation(observation: ObservationRow) {
  return {
    observedAt: observation.observedAt.toISOString(),
    temperature: Number(observation.temperature),
    windSpeed: Number(observation.windSpeed),
    windDirection: toNumberOrNull(observation.windDirection),
    humidity: toNumberOrNull(observation.humidity),
    pressure: toNumberOrNull(observation.pressure),
    precipitation: toNumberOrNull(observation.precipitation),
    weatherCode: observation.weatherCode,
    isDay: observation.isDay,
  };
}

export function serializeForecastHourly(row: ForecastHourlyRow) {
  return {
    validAt: row.validAt.toISOString(),
    temperature: Number(row.temperature),
    windSpeed: toNumberOrNull(row.windSpeed),
    windDirection: toNumberOrNull(row.windDirection),
    humidity: toNumberOrNull(row.humidity),
    precipitation: toNumberOrNull(row.precipitation),
    precipitationProbability: toNumberOrNull(row.precipitationProbability),
    weatherCode: row.weatherCode,
    isDay: row.isDay,
  };
}

export function serializeForecastDaily(row: ForecastDailyRow) {
  return {
    validDate: row.validDate,
    temperatureMin: Number(row.temperatureMin),
    temperatureMax: Number(row.temperatureMax),
    windSpeedMax: toNumberOrNull(row.windSpeedMax),
    precipitationSum: toNumberOrNull(row.precipitationSum),
    precipitationProbabilityMax: toNumberOrNull(row.precipitationProbabilityMax),
    weatherCode: row.weatherCode,
    sunrise: row.sunrise ? row.sunrise.toISOString() : null,
    sunset: row.sunset ? row.sunset.toISOString() : null,
  };
}

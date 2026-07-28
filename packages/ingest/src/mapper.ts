import type { ObservationInput, ForecastHourlyInput, ForecastDailyInput } from '@weather-demo/db';
import type { OpenMeteoResponse } from './open-meteo-schema';

export interface MapperCity {
  id: number;
}

/** Open-Meteo's compact ISO strings ("2026-07-27T12:00") requested with timezone=UTC. */
function toUtcDate(isoMinutePrecision: string): Date {
  return new Date(`${isoMinutePrecision}Z`);
}

function toUtcDateOnly(isoDate: string): string {
  return isoDate;
}

function fixed(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** Maps a validated Open-Meteo response into the row this project's schema stores for "now". */
export function mapObservation(
  response: OpenMeteoResponse,
  city: MapperCity,
  ingestRunId: number,
): ObservationInput {
  const { current } = response;
  return {
    cityId: city.id,
    ingestRunId,
    observedAt: toUtcDate(current.time),
    temperature: fixed(current.temperature_2m, 2),
    windSpeed: fixed(current.wind_speed_10m, 2),
    windDirection: fixed(current.wind_direction_10m, 1),
    humidity: fixed(current.relative_humidity_2m, 2),
    pressure: fixed(current.surface_pressure, 2),
    precipitation: fixed(current.precipitation, 2),
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
  };
}

/** Maps the hourly block into one row per hour Open-Meteo returned. */
export function mapForecastHourly(
  response: OpenMeteoResponse,
  city: MapperCity,
  ingestRunId: number,
): ForecastHourlyInput[] {
  const { hourly } = response;
  return hourly.time.map((time, index) => ({
    cityId: city.id,
    ingestRunId,
    validAt: toUtcDate(time),
    temperature: fixed(hourly.temperature_2m[index]!, 2),
    windSpeed: fixed(hourly.wind_speed_10m[index]!, 2),
    windDirection: fixed(hourly.wind_direction_10m[index]!, 1),
    humidity: fixed(hourly.relative_humidity_2m[index]!, 2),
    precipitation: fixed(hourly.precipitation[index]!, 2),
    precipitationProbability: fixed(hourly.precipitation_probability[index]!, 2),
    weatherCode: hourly.weather_code[index]!,
    isDay: hourly.is_day[index] === 1,
  }));
}

/** Maps the daily block into one row per day Open-Meteo returned. */
export function mapForecastDaily(
  response: OpenMeteoResponse,
  city: MapperCity,
  ingestRunId: number,
): ForecastDailyInput[] {
  const { daily } = response;
  return daily.time.map((date, index) => ({
    cityId: city.id,
    ingestRunId,
    validDate: toUtcDateOnly(date),
    temperatureMin: fixed(daily.temperature_2m_min[index]!, 2),
    temperatureMax: fixed(daily.temperature_2m_max[index]!, 2),
    windSpeedMax: fixed(daily.wind_speed_10m_max[index]!, 2),
    precipitationSum: fixed(daily.precipitation_sum[index]!, 2),
    precipitationProbabilityMax: fixed(daily.precipitation_probability_max[index]!, 2),
    weatherCode: daily.weather_code[index]!,
    sunrise: toUtcDate(daily.sunrise[index]!),
    sunset: toUtcDate(daily.sunset[index]!),
  }));
}

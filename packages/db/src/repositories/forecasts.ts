import { eq, asc } from 'drizzle-orm';
import type { Database } from '../client';
import { forecastHourly, forecastDaily } from '../schema/forecasts';
import { weatherCodes } from '../schema/lookups';

export type ForecastHourlyInput = typeof forecastHourly.$inferInsert;
export type ForecastDailyInput = typeof forecastDaily.$inferInsert;

export interface ForecastHourlyRow {
  cityId: number;
  ingestRunId: number;
  validAt: Date;
  temperature: string;
  windSpeed: string | null;
  windDirection: string | null;
  humidity: string | null;
  precipitation: string | null;
  precipitationProbability: string | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

export interface ForecastDailyRow {
  cityId: number;
  ingestRunId: number;
  validDate: string;
  temperatureMin: string;
  temperatureMax: string;
  windSpeedMax: string | null;
  precipitationSum: string | null;
  precipitationProbabilityMax: string | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  sunrise: Date | null;
  sunset: Date | null;
}

/**
 * Hourly forecast rows for a city, ordered by valid time ascending. Joined with weather_codes so
 * callers get a human-readable label — never duplicated as a hardcoded lookup on the client.
 */
export async function getForecastHourly(
  db: Database,
  cityId: number,
): Promise<ForecastHourlyRow[]> {
  return db
    .select({
      cityId: forecastHourly.cityId,
      ingestRunId: forecastHourly.ingestRunId,
      validAt: forecastHourly.validAt,
      temperature: forecastHourly.temperature,
      windSpeed: forecastHourly.windSpeed,
      windDirection: forecastHourly.windDirection,
      humidity: forecastHourly.humidity,
      precipitation: forecastHourly.precipitation,
      precipitationProbability: forecastHourly.precipitationProbability,
      weatherCode: forecastHourly.weatherCode,
      weatherLabel: weatherCodes.label,
      weatherIconKey: weatherCodes.iconKey,
      isDay: forecastHourly.isDay,
    })
    .from(forecastHourly)
    .innerJoin(weatherCodes, eq(forecastHourly.weatherCode, weatherCodes.code))
    .where(eq(forecastHourly.cityId, cityId))
    .orderBy(asc(forecastHourly.validAt));
}

/** Daily forecast rows for a city, ordered by valid date ascending. Joined as above. */
export async function getForecastDaily(db: Database, cityId: number): Promise<ForecastDailyRow[]> {
  return db
    .select({
      cityId: forecastDaily.cityId,
      ingestRunId: forecastDaily.ingestRunId,
      validDate: forecastDaily.validDate,
      temperatureMin: forecastDaily.temperatureMin,
      temperatureMax: forecastDaily.temperatureMax,
      windSpeedMax: forecastDaily.windSpeedMax,
      precipitationSum: forecastDaily.precipitationSum,
      precipitationProbabilityMax: forecastDaily.precipitationProbabilityMax,
      weatherCode: forecastDaily.weatherCode,
      weatherLabel: weatherCodes.label,
      weatherIconKey: weatherCodes.iconKey,
      sunrise: forecastDaily.sunrise,
      sunset: forecastDaily.sunset,
    })
    .from(forecastDaily)
    .innerJoin(weatherCodes, eq(forecastDaily.weatherCode, weatherCodes.code))
    .where(eq(forecastDaily.cityId, cityId))
    .orderBy(asc(forecastDaily.validDate));
}

/**
 * Bulk insert-or-update hourly forecast rows, keyed on the (city, valid_at) unique constraint —
 * re-ingesting the same hour updates it rather than duplicating it. A no-op on an empty array.
 */
export async function upsertForecastHourly(
  db: Database,
  rows: ForecastHourlyInput[],
): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await db
      .insert(forecastHourly)
      .values(row)
      .onConflictDoUpdate({
        target: [forecastHourly.cityId, forecastHourly.validAt],
        set: {
          ingestRunId: row.ingestRunId,
          temperature: row.temperature,
          windSpeed: row.windSpeed,
          windDirection: row.windDirection,
          humidity: row.humidity,
          precipitation: row.precipitation,
          precipitationProbability: row.precipitationProbability,
          weatherCode: row.weatherCode,
          isDay: row.isDay,
        },
      });
  }
}

/**
 * Bulk insert-or-update daily forecast rows, keyed on the (city, valid_date) unique constraint.
 * A no-op on an empty array.
 */
export async function upsertForecastDaily(db: Database, rows: ForecastDailyInput[]): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await db
      .insert(forecastDaily)
      .values(row)
      .onConflictDoUpdate({
        target: [forecastDaily.cityId, forecastDaily.validDate],
        set: {
          ingestRunId: row.ingestRunId,
          temperatureMin: row.temperatureMin,
          temperatureMax: row.temperatureMax,
          windSpeedMax: row.windSpeedMax,
          precipitationSum: row.precipitationSum,
          precipitationProbabilityMax: row.precipitationProbabilityMax,
          weatherCode: row.weatherCode,
          sunrise: row.sunrise,
          sunset: row.sunset,
        },
      });
  }
}

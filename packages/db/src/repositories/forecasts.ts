import { eq, asc } from 'drizzle-orm';
import type { Database } from '../client';
import { forecastHourly, forecastDaily } from '../schema/forecasts';

export type ForecastHourlyInput = typeof forecastHourly.$inferInsert;
export type ForecastHourlyRow = typeof forecastHourly.$inferSelect;
export type ForecastDailyInput = typeof forecastDaily.$inferInsert;
export type ForecastDailyRow = typeof forecastDaily.$inferSelect;

/** Hourly forecast rows for a city, ordered by valid time ascending. */
export async function getForecastHourly(
  db: Database,
  cityId: number,
): Promise<ForecastHourlyRow[]> {
  return db
    .select()
    .from(forecastHourly)
    .where(eq(forecastHourly.cityId, cityId))
    .orderBy(asc(forecastHourly.validAt));
}

/** Daily forecast rows for a city, ordered by valid date ascending. */
export async function getForecastDaily(db: Database, cityId: number): Promise<ForecastDailyRow[]> {
  return db
    .select()
    .from(forecastDaily)
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

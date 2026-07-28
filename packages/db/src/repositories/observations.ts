import { eq, desc } from 'drizzle-orm';
import type { Database } from '../client';
import { observations } from '../schema/observations';
import { weatherCodes } from '../schema/lookups';

export type ObservationInput = typeof observations.$inferInsert;

export interface ObservationRow {
  cityId: number;
  ingestRunId: number;
  observedAt: Date;
  temperature: string;
  windSpeed: string;
  windDirection: string | null;
  humidity: string | null;
  pressure: string | null;
  precipitation: string | null;
  weatherCode: number;
  /** Human-readable label for `weatherCode`, joined from weather_codes — never duplicated as a
   * hardcoded lookup on the client, per the constitution's normalized-schema principle. */
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

/** The most recent observation for a city, or undefined if none have been ingested yet. */
export async function getLatestObservation(
  db: Database,
  cityId: number,
): Promise<ObservationRow | undefined> {
  const rows = await db
    .select({
      cityId: observations.cityId,
      ingestRunId: observations.ingestRunId,
      observedAt: observations.observedAt,
      temperature: observations.temperature,
      windSpeed: observations.windSpeed,
      windDirection: observations.windDirection,
      humidity: observations.humidity,
      pressure: observations.pressure,
      precipitation: observations.precipitation,
      weatherCode: observations.weatherCode,
      weatherLabel: weatherCodes.label,
      weatherIconKey: weatherCodes.iconKey,
      isDay: observations.isDay,
    })
    .from(observations)
    .innerJoin(weatherCodes, eq(observations.weatherCode, weatherCodes.code))
    .where(eq(observations.cityId, cityId))
    .orderBy(desc(observations.observedAt))
    .limit(1);
  return rows[0];
}

/**
 * Insert or update an observation for a city at a point in time, keyed on the (city, observed_at)
 * unique constraint — re-ingesting the same instant updates the row rather than duplicating it.
 */
export async function upsertObservation(db: Database, row: ObservationInput): Promise<void> {
  await db
    .insert(observations)
    .values(row)
    .onConflictDoUpdate({
      target: [observations.cityId, observations.observedAt],
      set: {
        ingestRunId: row.ingestRunId,
        temperature: row.temperature,
        windSpeed: row.windSpeed,
        windDirection: row.windDirection,
        humidity: row.humidity,
        pressure: row.pressure,
        precipitation: row.precipitation,
        weatherCode: row.weatherCode,
        isDay: row.isDay,
      },
    });
}

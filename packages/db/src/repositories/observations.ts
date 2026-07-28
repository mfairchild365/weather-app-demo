import { eq, desc } from 'drizzle-orm';
import type { Database } from '../client';
import { observations } from '../schema/observations';

export type ObservationInput = typeof observations.$inferInsert;
export type ObservationRow = typeof observations.$inferSelect;

/** The most recent observation for a city, or undefined if none have been ingested yet. */
export async function getLatestObservation(
  db: Database,
  cityId: number,
): Promise<ObservationRow | undefined> {
  const rows = await db
    .select()
    .from(observations)
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

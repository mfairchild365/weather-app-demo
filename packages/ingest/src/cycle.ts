import {
  type Database,
  getCities,
  upsertObservation,
  upsertForecastHourly,
  upsertForecastDaily,
  createIngestRun,
  completeIngestRun,
} from '@weather-demo/db';
import { fetchForecast } from './open-meteo-client';
import { mapObservation, mapForecastHourly, mapForecastDaily } from './mapper';

export interface CityFailure {
  slug: string;
  error: string;
}

export interface CycleResult {
  ingestRunId: number;
  succeededCities: string[];
  failedCities: CityFailure[];
}

/**
 * Runs one ingestion cycle: creates an ingest_runs row, fetches + maps + upserts every city's
 * current conditions and forecast, and completes the run. A single city's failure (network error,
 * validation failure, or a write failure) is caught, recorded, and does not stop the rest of the
 * cycle (spec FR-004/FR-005, SC-004) — the cycle as a whole is `success` as long as it completed,
 * with per-city failures summarized in the run's `error` field.
 */
export async function runCycle(db: Database, providerId: number): Promise<CycleResult> {
  const ingestRunId = await createIngestRun(db, providerId);
  const cities = await getCities(db);

  const succeededCities: string[] = [];
  const failedCities: CityFailure[] = [];

  for (const city of cities) {
    try {
      const response = await fetchForecast({
        latitude: city.latitude,
        longitude: city.longitude,
      });
      await upsertObservation(db, mapObservation(response, city, ingestRunId));
      await upsertForecastHourly(db, mapForecastHourly(response, city, ingestRunId));
      await upsertForecastDaily(db, mapForecastDaily(response, city, ingestRunId));
      succeededCities.push(city.slug);
    } catch (error) {
      failedCities.push({
        slug: city.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const errorSummary =
    failedCities.length > 0
      ? failedCities.map((failure) => `${failure.slug}: ${failure.error}`).join('; ')
      : undefined;

  await completeIngestRun(db, ingestRunId, { status: 'success', error: errorSummary });

  return { ingestRunId, succeededCities, failedCities };
}

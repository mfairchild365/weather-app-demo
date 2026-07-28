import { createDatabase, requireEnv, getProviderByKey } from '@weather-demo/db';
import { runCycle } from './cycle';
import { startScheduler } from './scheduler';

async function main(): Promise<void> {
  // Connects with the weather_ingest role only — this process never holds broader credentials
  // (constitution Principle III; spec FR-001).
  const { db } = createDatabase(requireEnv('DATABASE_URL_INGEST'));

  const provider = await getProviderByKey(db, 'open-meteo');
  if (!provider) {
    throw new Error("Provider 'open-meteo' not found — has the platform foundation been seeded?");
  }

  startScheduler(async () => {
    const result = await runCycle(db, provider.id);
    console.log(
      `Ingestion cycle ${result.ingestRunId}: ${result.succeededCities.length} succeeded, ` +
        `${result.failedCities.length} failed.`,
    );
    if (result.failedCities.length > 0) {
      console.warn('Failed cities:', result.failedCities);
    }
  });

  console.log('Weather ingestion worker started.');
}

main().catch((error: unknown) => {
  console.error('Ingestion worker failed to start:', error);
  process.exitCode = 1;
});

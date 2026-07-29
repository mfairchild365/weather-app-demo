import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase, type Database } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { getProviderByKey } from './providers';
import { getLatestObservation, upsertObservation } from './observations';
import { createIngestRun } from './ingest-runs';
import { insertTestCity } from './test-helpers';

async function seededProviderId(db: Database): Promise<number> {
  const provider = await getProviderByKey(db, 'open-meteo');
  if (!provider) throw new Error('Seeded provider not found: open-meteo');
  return provider.id;
}

describe('observations repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await disconnect();
    }
  });

  it('upserts on (city, observed_at): a second write for the same instant updates, not duplicates', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const cityId = await insertTestCity(db, 'db-test-observations-upsert', 'Upsert Test City');
      const providerId = await seededProviderId(db);
      const ingestRunId = await createIngestRun(db, providerId);
      const observedAt = new Date('2026-07-27T12:00:00Z');

      await upsertObservation(db, {
        cityId,
        ingestRunId,
        observedAt,
        temperature: '21.50',
        windSpeed: '10.00',
        windDirection: '180.0',
        humidity: '55.00',
        pressure: '1012.00',
        precipitation: '0.00',
        weatherCode: 1,
        isDay: true,
      });

      await upsertObservation(db, {
        cityId,
        ingestRunId,
        observedAt,
        temperature: '23.00',
        windSpeed: '12.00',
        windDirection: '190.0',
        humidity: '50.00',
        pressure: '1011.00',
        precipitation: '0.00',
        weatherCode: 2,
        isDay: true,
      });

      const latest = await getLatestObservation(db, cityId);
      expect(latest?.temperature).toBe('23.00');
      expect(latest?.weatherCode).toBe(2);
    } finally {
      await disconnect();
    }
  });

  it('getLatestObservation returns undefined when a city has no observations yet', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const cityId = await insertTestCity(db, 'db-test-observations-empty', 'Empty Test City');
      const latest = await getLatestObservation(db, cityId);
      expect(latest).toBeUndefined();
    } finally {
      await disconnect();
    }
  });
});

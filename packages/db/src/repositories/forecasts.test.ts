import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDatabase, type Database } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { providers } from '../schema/providers';
import {
  getForecastHourly,
  getForecastDaily,
  upsertForecastHourly,
  upsertForecastDaily,
} from './forecasts';
import { createIngestRun } from './ingest-runs';
import { insertTestCity } from './test-helpers';

async function seededProviderId(db: Database): Promise<number> {
  const [row] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.key, 'open-meteo'));
  if (!row) throw new Error('Seeded provider not found: open-meteo');
  return row.id;
}

describe('forecasts repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await pool.end();
    }
  });

  it('upserts hourly rows on (city, valid_at), ordered by valid time ascending', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const cityId = await insertTestCity(db, 'db-test-forecasts-hourly', 'Hourly Test City');
      const providerId = await seededProviderId(db);
      const ingestRunId = await createIngestRun(db, providerId);
      const hourOne = new Date('2026-07-27T13:00:00Z');
      const hourTwo = new Date('2026-07-27T14:00:00Z');

      await upsertForecastHourly(db, [
        {
          cityId,
          ingestRunId,
          validAt: hourTwo,
          temperature: '19.00',
          windSpeed: '5.00',
          windDirection: '90.0',
          humidity: '60.00',
          precipitation: '0.00',
          precipitationProbability: '10.00',
          weatherCode: 1,
          isDay: true,
        },
        {
          cityId,
          ingestRunId,
          validAt: hourOne,
          temperature: '18.00',
          windSpeed: '4.00',
          windDirection: '80.0',
          humidity: '62.00',
          precipitation: '0.00',
          precipitationProbability: '5.00',
          weatherCode: 0,
          isDay: true,
        },
      ]);

      // Re-ingest hourOne with a different temperature — should update, not duplicate.
      await upsertForecastHourly(db, [
        {
          cityId,
          ingestRunId,
          validAt: hourOne,
          temperature: '20.00',
          windSpeed: '4.00',
          windDirection: '80.0',
          humidity: '62.00',
          precipitation: '0.00',
          precipitationProbability: '5.00',
          weatherCode: 0,
          isDay: true,
        },
      ]);

      const rows = await getForecastHourly(db, cityId);
      expect(rows).toHaveLength(2);
      expect(rows[0]?.validAt).toEqual(hourOne);
      expect(rows[0]?.temperature).toBe('20.00');
      expect(rows[1]?.validAt).toEqual(hourTwo);
    } finally {
      await pool.end();
    }
  });

  it('upserts daily rows on (city, valid_date)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const cityId = await insertTestCity(db, 'db-test-forecasts-daily', 'Daily Test City');
      const providerId = await seededProviderId(db);
      const ingestRunId = await createIngestRun(db, providerId);

      await upsertForecastDaily(db, [
        {
          cityId,
          ingestRunId,
          validDate: '2026-07-28',
          temperatureMin: '10.00',
          temperatureMax: '18.00',
          windSpeedMax: '15.00',
          precipitationSum: '0.00',
          precipitationProbabilityMax: '5.00',
          weatherCode: 0,
          sunrise: new Date('2026-07-28T06:00:00Z'),
          sunset: new Date('2026-07-28T17:00:00Z'),
        },
      ]);

      const rows = await getForecastDaily(db, cityId);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.temperatureMax).toBe('18.00');
    } finally {
      await pool.end();
    }
  });

  it('upserting an empty array is a no-op', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await expect(upsertForecastHourly(db, [])).resolves.not.toThrow();
      await expect(upsertForecastDaily(db, [])).resolves.not.toThrow();
    } finally {
      await pool.end();
    }
  });
});

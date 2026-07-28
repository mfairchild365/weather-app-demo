import { describe, it, expect, beforeAll } from 'vitest';
import {
  createDatabase,
  getProviderByKey,
  createIngestRun,
  completeIngestRun,
  upsertObservation,
  upsertForecastHourly,
  upsertForecastDaily,
  type Database,
} from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { seed } from '@weather-demo/db/seed';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import { insertTestCity } from '@weather-demo/db/test-helpers';
import { buildApp } from '../app';

// This suite's own cities, distinct from the shared seed data and never touched by ingest
// package tests — cities.test.ts and cycle.test.ts share one live TEST_DATABASE_URL (see
// vitest.config.ts's fileParallelism note), so relying on a seeded city like "portland-us"
// staying pristine across the whole test run would be fragile.
const WITH_DATA_SLUG = 'api-test-city-with-data';
const NO_DATA_SLUG = 'api-test-city-no-data';

async function seedOneCycleFor(db: Database, cityId: number): Promise<void> {
  const provider = await getProviderByKey(db, 'open-meteo');
  if (!provider) throw new Error('seeded provider missing');
  const ingestRunId = await createIngestRun(db, provider.id);

  await upsertObservation(db, {
    cityId,
    ingestRunId,
    observedAt: new Date('2026-07-27T12:00:00Z'),
    temperature: '22.50',
    windSpeed: '8.00',
    windDirection: '270.0',
    humidity: '50.00',
    pressure: '1013.00',
    precipitation: '0.00',
    weatherCode: 1,
    isDay: true,
  });
  await upsertForecastHourly(db, [
    {
      cityId,
      ingestRunId,
      validAt: new Date('2026-07-27T13:00:00Z'),
      temperature: '23.00',
      windSpeed: '8.50',
      windDirection: '270.0',
      humidity: '48.00',
      precipitation: '0.00',
      precipitationProbability: '0.00',
      weatherCode: 1,
      isDay: true,
    },
  ]);
  await upsertForecastDaily(db, [
    {
      cityId,
      ingestRunId,
      validDate: '2026-07-27',
      temperatureMin: '15.00',
      temperatureMax: '24.00',
      windSpeedMax: '10.00',
      precipitationSum: '0.00',
      precipitationProbabilityMax: '5.00',
      weatherCode: 1,
      sunrise: new Date('2026-07-27T13:00:00Z'),
      sunset: new Date('2026-07-28T03:00:00Z'),
    },
  ]);
  await completeIngestRun(db, ingestRunId, { status: 'success' });
}

describe('cities routes', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
      await insertTestCity(db, NO_DATA_SLUG, 'No Data City');
      const withDataId = await insertTestCity(db, WITH_DATA_SLUG, 'With Data City');
      await seedOneCycleFor(db, withDataId);
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities returns every seeded city (Acceptance Scenario US2.1)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/cities' });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.length).toBeGreaterThanOrEqual(10);
      expect(body.find((c: { slug: string }) => c.slug === 'portland-us')).toMatchObject({
        name: 'Portland',
        region: { code: 'US' },
      });

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug returns city detail with its latest observation (US2.2)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: `/api/cities/${WITH_DATA_SLUG}` });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.latestObservation).toMatchObject({
        temperature: 22.5,
        weatherCode: 1,
        weatherLabel: 'Mainly clear',
      });
      expect(body.dataAsOf).not.toBeNull();

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug returns null observation for a city with no data yet (edge case)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: `/api/cities/${NO_DATA_SLUG}` });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ latestObservation: null, dataAsOf: null });

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug returns 404 with a JSON error body for an unknown slug (US2.4)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/cities/nonexistent' });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: 'not_found' });

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug/forecast?range=hourly returns hourly rows (US2.3)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({
        method: 'GET',
        url: `/api/cities/${WITH_DATA_SLUG}/forecast?range=hourly`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.range).toBe('hourly');
      expect(body.rows).toHaveLength(1);
      expect(body.rows[0]).toMatchObject({ temperature: 23 });

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug/forecast?range=daily returns daily rows', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({
        method: 'GET',
        url: `/api/cities/${WITH_DATA_SLUG}/forecast?range=daily`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.range).toBe('daily');
      expect(body.rows[0]).toMatchObject({ temperatureMax: 24 });

      await app.close();
    } finally {
      await pool.end();
    }
  });

  it('GET /api/cities/:slug/forecast rejects an invalid range with 400 (FR-010, edge case)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({
        method: 'GET',
        url: `/api/cities/${WITH_DATA_SLUG}/forecast?range=weekly`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: 'bad_request' });

      await app.close();
    } finally {
      await pool.end();
    }
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createDatabase,
  getProviderByKey,
  createIngestRun,
  completeIngestRun,
} from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { seed } from '@weather-demo/db/seed';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import { buildApp } from '../app';

describe('GET /api/meta/freshness', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
      const provider = await getProviderByKey(db, 'open-meteo');
      if (!provider) throw new Error('seeded provider missing');
      const runId = await createIngestRun(db, provider.id);
      await completeIngestRun(db, runId, { status: 'success' });
    } finally {
      await disconnect();
    }
  });

  it('reflects the most recent successful ingest run (US3.1)', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/meta/freshness' });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.provider).toBe('Open-Meteo');
      expect(body.lastSuccessfulRunAt).not.toBeNull();

      await app.close();
    } finally {
      await disconnect();
    }
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import { buildApp } from '../app';

describe('GET /api/health', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
  });

  it('returns 200 with status ok', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/health' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });

      await app.close();
    } finally {
      await pool.end();
    }
  });
});

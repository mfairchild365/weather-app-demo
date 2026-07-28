import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { createDatabase, getProviderByKey } from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { seed } from '@weather-demo/db/seed';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import fixture from './__fixtures__/open-meteo-response.json' with { type: 'json' };
import { runCycle } from './cycle';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runCycle', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await pool.end();
    }
  });

  it("a single city's fetch failure does not prevent the others from succeeding (SC-004)", async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const provider = await getProviderByKey(db, 'open-meteo');
      if (!provider) throw new Error('seeded provider missing');

      // Portland's request fails; every other seeded city succeeds using the fixture.
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string) => {
          const url = new URL(input);
          if (url.searchParams.get('latitude') === '45.51520') {
            return {
              ok: false,
              status: 500,
              statusText: 'Internal Server Error',
              json: async () => ({}),
            } as Response;
          }
          return { ok: true, status: 200, statusText: 'OK', json: async () => fixture } as Response;
        }),
      );

      const result = await runCycle(db, provider.id);

      expect(result.failedCities).toHaveLength(1);
      expect(result.failedCities[0]?.slug).toBe('portland-us');
      expect(result.succeededCities.length).toBeGreaterThan(5);
      expect(result.succeededCities).not.toContain('portland-us');
      expect(result.succeededCities).toContain('tokyo-jp');
    } finally {
      await pool.end();
    }
  });

  it('records zero failures when every city succeeds', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            ({ ok: true, status: 200, statusText: 'OK', json: async () => fixture }) as Response,
        ),
      );
      const provider = await getProviderByKey(db, 'open-meteo');
      if (!provider) throw new Error('seeded provider missing');

      const result = await runCycle(db, provider.id);

      expect(result.failedCities).toHaveLength(0);
      expect(result.succeededCities.length).toBeGreaterThanOrEqual(10);
    } finally {
      await pool.end();
    }
  });
});

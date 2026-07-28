import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { getCities, getCityBySlug } from './cities';

describe('cities repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await pool.end();
    }
  });

  it('getCities returns every seeded city joined with its region', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const result = await getCities(db);
      expect(result.length).toBeGreaterThanOrEqual(10);
      const portland = result.find((city) => city.slug === 'portland-us');
      expect(portland).toMatchObject({ name: 'Portland', region: { code: 'US' } });
    } finally {
      await pool.end();
    }
  });

  it('getCityBySlug finds an existing city and returns undefined for an unknown one', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const found = await getCityBySlug(db, 'tokyo-jp');
      expect(found).toMatchObject({ name: 'Tokyo', region: { code: 'JP' } });

      const missing = await getCityBySlug(db, 'nonexistent-city');
      expect(missing).toBeUndefined();
    } finally {
      await pool.end();
    }
  });
});

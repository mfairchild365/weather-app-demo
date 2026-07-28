import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from './client.js';
import { seed } from './seed.js';
import { runMigrations } from './migrate.js';
import { cities } from './schema/cities.js';
import { testDatabaseUrl } from './test-utils.js';

describe('seed', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
  });

  it('is idempotent: running twice yields the same row count (spec FR-008)', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
      const first = await db.select({ id: cities.id }).from(cities);

      await seed(db);
      const second = await db.select({ id: cities.id }).from(cities);

      expect(second.length).toBe(first.length);
      expect(first.length).toBeGreaterThanOrEqual(10);
    } finally {
      await pool.end();
    }
  });
});

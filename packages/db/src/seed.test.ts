import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from './client.js';
import { seed } from './seed.js';
import { runMigrations } from './migrate.js';
import { testDatabaseUrl } from './test-utils.js';

describe('seed', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
  });

  it('is idempotent: running twice yields the same row count (spec FR-008)', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
      const first = await db.city.count();

      await seed(db);
      const second = await db.city.count();

      expect(second).toBe(first);
      expect(first).toBeGreaterThanOrEqual(10);
    } finally {
      await disconnect();
    }
  });
});

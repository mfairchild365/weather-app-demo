import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { getProviderByKey } from './providers';

describe('providers repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await disconnect();
    }
  });

  it('finds a seeded provider by key and returns undefined for an unknown one', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const found = await getProviderByKey(db, 'open-meteo');
      expect(found).toMatchObject({ name: 'Open-Meteo' });

      const missing = await getProviderByKey(db, 'nonexistent-provider');
      expect(missing).toBeUndefined();
    } finally {
      await disconnect();
    }
  });
});

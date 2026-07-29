import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase, type Database } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { getProviderByKey } from './providers';
import { createIngestRun, completeIngestRun, getLatestSuccessfulIngestRun } from './ingest-runs';

async function seededProviderId(db: Database): Promise<number> {
  const provider = await getProviderByKey(db, 'open-meteo');
  if (!provider) throw new Error('Seeded provider not found: open-meteo');
  return provider.id;
}

describe('ingest-runs repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await disconnect();
    }
  });

  it('creates a running row, then completes it, then surfaces it as the latest success', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const providerId = await seededProviderId(db);
      const id = await createIngestRun(db, providerId);

      await completeIngestRun(db, id, { status: 'success' });

      const latest = await getLatestSuccessfulIngestRun(db);
      expect(latest?.id).toBe(id);
      expect(latest?.status).toBe('success');
      expect(latest?.finishedAt).not.toBeNull();
    } finally {
      await disconnect();
    }
  });

  it('a failed run is not returned as the latest success', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const providerId = await seededProviderId(db);
      const successId = await createIngestRun(db, providerId);
      await completeIngestRun(db, successId, { status: 'success' });

      const failedId = await createIngestRun(db, providerId);
      await completeIngestRun(db, failedId, {
        status: 'failed',
        error: 'nairobi-ke: fetch failed',
      });

      const latest = await getLatestSuccessfulIngestRun(db);
      expect(latest?.id).not.toBe(failedId);
    } finally {
      await disconnect();
    }
  });
});

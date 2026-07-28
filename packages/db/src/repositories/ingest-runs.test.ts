import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { createDatabase, type Database } from '../client';
import { runMigrations } from '../migrate';
import { seed } from '../seed';
import { testDatabaseUrl } from '../test-utils';
import { providers } from '../schema/providers';
import { createIngestRun, completeIngestRun, getLatestSuccessfulIngestRun } from './ingest-runs';

async function seededProviderId(db: Database): Promise<number> {
  const [row] = await db
    .select({ id: providers.id })
    .from(providers)
    .where(eq(providers.key, 'open-meteo'));
  if (!row) throw new Error('Seeded provider not found: open-meteo');
  return row.id;
}

describe('ingest-runs repository', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await pool.end();
    }
  });

  it('creates a running row, then completes it, then surfaces it as the latest success', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
    try {
      const providerId = await seededProviderId(db);
      const id = await createIngestRun(db, providerId);

      await completeIngestRun(db, id, { status: 'success' });

      const latest = await getLatestSuccessfulIngestRun(db);
      expect(latest?.id).toBe(id);
      expect(latest?.status).toBe('success');
      expect(latest?.finishedAt).not.toBeNull();
    } finally {
      await pool.end();
    }
  });

  it('a failed run is not returned as the latest success', async () => {
    const { db, pool } = createDatabase(testDatabaseUrl());
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
      await pool.end();
    }
  });
});

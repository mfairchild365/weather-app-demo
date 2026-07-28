import { eq, desc } from 'drizzle-orm';
import type { Database } from '../client';
import { ingestRuns } from '../schema/ingest-runs';

export type IngestRunRow = typeof ingestRuns.$inferSelect;

/** Starts a new ingest run row (status `running`) and returns its id. */
export async function createIngestRun(db: Database, providerId: number): Promise<number> {
  const rows = await db
    .insert(ingestRuns)
    .values({ providerId, status: 'running' })
    .returning({ id: ingestRuns.id });
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create ingest run');
  }
  return row.id;
}

export interface CompleteIngestRunResult {
  status: 'success' | 'failed';
  error?: string | undefined;
}

/** Marks an ingest run finished, recording its overall status and any error summary. */
export async function completeIngestRun(
  db: Database,
  id: number,
  result: CompleteIngestRunResult,
): Promise<void> {
  await db
    .update(ingestRuns)
    .set({ status: result.status, error: result.error ?? null, finishedAt: new Date() })
    .where(eq(ingestRuns.id, id));
}

/** A single ingest run by id, or undefined if it doesn't exist. */
export async function getIngestRunById(
  db: Database,
  id: number,
): Promise<IngestRunRow | undefined> {
  const rows = await db.select().from(ingestRuns).where(eq(ingestRuns.id, id)).limit(1);
  return rows[0];
}

/** The most recently completed successful ingest run, or undefined if none have succeeded yet. */
export async function getLatestSuccessfulIngestRun(
  db: Database,
): Promise<IngestRunRow | undefined> {
  const rows = await db
    .select()
    .from(ingestRuns)
    .where(eq(ingestRuns.status, 'success'))
    .orderBy(desc(ingestRuns.finishedAt))
    .limit(1);
  return rows[0];
}

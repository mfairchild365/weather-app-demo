import type { Database } from '../client';

export type IngestRunStatus = 'running' | 'success' | 'failed';

export interface IngestRunRow {
  id: number;
  providerId: number;
  startedAt: Date;
  finishedAt: Date | null;
  status: IngestRunStatus;
  error: string | null;
}

/** Starts a new ingest run row (status `running`) and returns its id. */
export async function createIngestRun(db: Database, providerId: number): Promise<number> {
  const row = await db.ingestRun.create({
    data: { providerId, status: 'running' },
    select: { id: true },
  });
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
  await db.ingestRun.update({
    where: { id },
    data: { status: result.status, error: result.error ?? null, finishedAt: new Date() },
  });
}

/** A single ingest run by id, or undefined if it doesn't exist. */
export async function getIngestRunById(
  db: Database,
  id: number,
): Promise<IngestRunRow | undefined> {
  const row = await db.ingestRun.findUnique({ where: { id } });
  return row ?? undefined;
}

/** The most recently completed successful ingest run, or undefined if none have succeeded yet. */
export async function getLatestSuccessfulIngestRun(
  db: Database,
): Promise<IngestRunRow | undefined> {
  const row = await db.ingestRun.findFirst({
    where: { status: 'success' },
    orderBy: { finishedAt: 'desc' },
  });
  return row ?? undefined;
}

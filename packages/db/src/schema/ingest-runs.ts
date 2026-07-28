import { pgTable, serial, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { providers } from './providers';

export const ingestRunStatus = pgEnum('ingest_run_status', ['running', 'success', 'failed']);

/**
 * One execution of the scheduled ingestion job. Powers a "data last updated" indicator and lets
 * every observation/forecast row trace back to the run that produced it.
 */
export const ingestRuns = pgTable('ingest_runs', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: ingestRunStatus('status').notNull().default('running'),
  error: text('error'),
});

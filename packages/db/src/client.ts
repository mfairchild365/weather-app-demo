import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';

export type Database = NodePgDatabase<typeof schema>;

/**
 * Create a Drizzle client from a Postgres connection string. Callers choose which role's
 * connection string to pass — the client itself has no notion of "read-only" or "read-write";
 * that guarantee lives entirely in which Postgres role the string authenticates as (see
 * roles.sql and constitution Principle III).
 */
export function createDatabase(connectionString: string): { db: Database; pool: Pool } {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

/** Reads `envVar` and throws a clear error if it is unset, instead of connecting with `undefined`. */
export function requireEnv(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
  return value;
}

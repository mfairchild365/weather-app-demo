import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export type Database = PrismaClient;

/**
 * Create a Prisma client from a Postgres connection string, via the `@prisma/adapter-pg` driver
 * adapter (mandatory in Prisma 7 — `new PrismaClient()` without one throws). Callers choose which
 * role's connection string to pass — the client itself has no notion of "read-only" or
 * "read-write"; that guarantee lives entirely in which Postgres role the string authenticates as
 * (see roles.sql and constitution Principle III).
 */
export function createDatabase(connectionString: string): {
  db: Database;
  disconnect: () => Promise<void>;
} {
  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });
  return { db, disconnect: () => db.$disconnect() };
}

/**
 * A raw `pg` pool for the one thing Prisma Client itself doesn't do: role/grant DDL
 * (`CREATE ROLE`, `GRANT ...`) run by src/apply-roles.ts against the owner connection. Kept
 * separate from `createDatabase` so that script's admin operations don't have to go through the
 * Prisma query engine at all.
 */
export function createAdminPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

/** Reads `envVar` and throws a clear error if it is unset, instead of connecting with `undefined`. */
export function requireEnv(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
  return value;
}

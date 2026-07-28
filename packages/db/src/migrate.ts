import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase, requireEnv } from './client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '..', 'migrations');

/**
 * Applies every pending checked-in migration. drizzle-orm's migrator tracks applied migrations in
 * its own `__drizzle_migrations` table, so running this twice against the same database is a
 * no-op the second time (idempotent, per spec FR-006 / tasks.md T016).
 */
export async function runMigrations(connectionString: string): Promise<void> {
  const { db, pool } = createDatabase(connectionString);
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const connectionString = requireEnv('DATABASE_URL_OWNER');
  await runMigrations(connectionString);
  console.log('Migrations applied.');
}

// Only run automatically when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  });
}

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { requireEnv } from './client';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// packages/db/src/migrate.ts -> repo root, resolved from this file's own location so it works
// regardless of the process's cwd (a local `npm run db:migrate` runs with cwd=packages/db; the
// `migrate` container in docker-compose.yml runs this with cwd=/app, the repo root).
const prismaConfigPath = path.join(__dirname, '..', '..', '..', 'prisma.config.ts');

/**
 * Applies every pending checked-in migration via `prisma migrate deploy` (Prisma has no
 * programmatic migrate API, so this shells out — the same approach docker/migrate-entrypoint.sh
 * and every other packages/db script already takes for CLI-only operations). Prisma tracks
 * applied migrations in its own `_prisma_migrations` table, so running this twice against the
 * same database is a no-op the second time (idempotent, per spec FR-006 / tasks.md T016).
 */
export async function runMigrations(connectionString: string): Promise<void> {
  await execFileAsync('npx', ['prisma', 'migrate', 'deploy', '--config', prismaConfigPath], {
    env: { ...process.env, DATABASE_URL_OWNER: connectionString },
  });
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

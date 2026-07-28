import { createDatabase, requireEnv } from './client';
import { cities } from './schema/cities';

/**
 * Last CI step after migrate + seed: confirm the database is actually queryable and seeded.
 * Exits non-zero if the seeded city count is 0 (tasks.md T024).
 */
async function main(): Promise<void> {
  const { db, pool } = createDatabase(requireEnv('DATABASE_URL_OWNER'));
  try {
    const rows = await db.select({ id: cities.id }).from(cities);
    if (rows.length === 0) {
      throw new Error('Smoke check failed: 0 cities found after migrate + seed.');
    }
    console.log(`Smoke check passed: ${rows.length} cities found.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

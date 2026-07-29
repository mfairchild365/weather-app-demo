import { createDatabase, requireEnv } from './client';

/**
 * Last CI step after migrate + seed: confirm the database is actually queryable and seeded.
 * Exits non-zero if the seeded city count is 0 (tasks.md T024).
 */
async function main(): Promise<void> {
  const { db, disconnect } = createDatabase(requireEnv('DATABASE_URL_OWNER'));
  try {
    const count = await db.city.count();
    if (count === 0) {
      throw new Error('Smoke check failed: 0 cities found after migrate + seed.');
    }
    console.log(`Smoke check passed: ${count} cities found.`);
  } finally {
    await disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

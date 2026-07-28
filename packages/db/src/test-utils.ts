import { requireEnv } from './client.js';

/**
 * Connection string integration tests use to reach a real Postgres instance. In CI this is the
 * `postgres:16` service container (see .github/workflows/ci.yml); for local runs, point it at a
 * throwaway Postgres (see README "Running tests locally").
 */
export function testDatabaseUrl(): string {
  return requireEnv('TEST_DATABASE_URL');
}

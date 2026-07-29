import { describe, it, expect, beforeAll } from 'vitest';
import { Pool } from 'pg';
import { createAdminPool } from './client.js';
import { runMigrations } from './migrate.js';
import { applyRoles } from './apply-roles.js';
import { testDatabaseUrl } from './test-utils.js';

const TEST_INGEST_PASSWORD = 'test-ingest-password';
const TEST_API_PASSWORD = 'test-api-password';

function connectionStringAs(role: string, password: string): string {
  const url = new URL(testDatabaseUrl());
  url.username = role;
  url.password = password;
  return url.toString();
}

describe('applyRoles', () => {
  beforeAll(async () => {
    const url = testDatabaseUrl();
    await runMigrations(url);
    const pool = createAdminPool(url);
    try {
      await applyRoles(pool, { ingest: TEST_INGEST_PASSWORD, api: TEST_API_PASSWORD });
    } finally {
      await pool.end();
    }
  });

  it('grants weather_api SELECT-only privileges (spec FR-007)', async () => {
    const pool = createAdminPool(testDatabaseUrl());
    try {
      const { rows } = await pool.query<{ can_select: boolean; can_insert: boolean }>(
        `SELECT
           has_table_privilege('weather_api', 'cities', 'SELECT') AS can_select,
           has_table_privilege('weather_api', 'cities', 'INSERT') AS can_insert`,
      );
      expect(rows[0]?.can_select).toBe(true);
      expect(rows[0]?.can_insert).toBe(false);
    } finally {
      await pool.end();
    }
  });

  it('grants weather_ingest write access only to the tables it populates', async () => {
    const pool = createAdminPool(testDatabaseUrl());
    try {
      const { rows } = await pool.query<{
        can_insert_observations: boolean;
        can_insert_cities: boolean;
      }>(
        `SELECT
           has_table_privilege('weather_ingest', 'observations', 'INSERT') AS can_insert_observations,
           has_table_privilege('weather_ingest', 'cities', 'INSERT') AS can_insert_cities`,
      );
      expect(rows[0]?.can_insert_observations).toBe(true);
      expect(rows[0]?.can_insert_cities).toBe(false);
    } finally {
      await pool.end();
    }
  });

  it('denies an actual write attempted with the weather_api role credentials (SC-003)', async () => {
    const pool = new Pool({
      connectionString: connectionStringAs('weather_api', TEST_API_PASSWORD),
    });
    try {
      await expect(
        pool.query(
          `INSERT INTO cities (region_id, name, slug, latitude, longitude, timezone)
           VALUES (1, 'Should Fail', 'should-fail-role-test', '0', '0', 'UTC')`,
        ),
      ).rejects.toThrow(/permission denied/i);
    } finally {
      await pool.end();
    }
  });
});

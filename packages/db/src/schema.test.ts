import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from './client';
import { runMigrations } from './migrate';
import { testDatabaseUrl } from './test-utils';

/**
 * Structural checks on the *deployed* schema (prisma/schema.prisma, applied via
 * prisma/migrations) — the normalization guarantees constitution Principle IV is about. These
 * query information_schema directly against the live test database rather than the ORM's
 * design-time model, so they catch a real migration drifting from schema.prisma just as readily
 * as a schema regression.
 */
describe('lookup schema shape', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
  });

  it('weather_codes has no free-text duplication of a code elsewhere — it is the single source', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const columns = await db.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'weather_codes'
        ORDER BY ordinal_position
      `;
      expect(columns.map((c) => c.column_name)).toEqual(['code', 'label', 'icon_key']);

      const primaryKeyColumns = await db.$queryRaw<{ column_name: string }[]>`
        SELECT kcu.column_name FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = 'weather_codes'
          AND tc.constraint_type = 'PRIMARY KEY'
      `;
      expect(primaryKeyColumns.map((c) => c.column_name)).toEqual(['code']);
    } finally {
      await disconnect();
    }
  });

  it('measurement_types has a unique key, not just a display name', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      expect(await isUniqueColumn(db, 'measurement_types', 'key')).toBe(true);
    } finally {
      await disconnect();
    }
  });

  it('units are scoped to exactly one measurement type via FK, not a free-text category', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const notNull = await db.$queryRaw<{ is_nullable: string }[]>`
        SELECT is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'units' AND column_name = 'measurement_type_id'
      `;
      expect(notNull[0]?.is_nullable).toBe('NO');
      expect(await isUniqueColumn(db, 'units', 'key')).toBe(true);
    } finally {
      await disconnect();
    }
  });

  it('provider_units keys the (provider, measurement) pair to a single unit', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const columns = await db.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'provider_units'
        ORDER BY ordinal_position
      `;
      expect(columns.map((c) => c.column_name)).toEqual([
        'provider_id',
        'measurement_type_id',
        'unit_id',
      ]);
    } finally {
      await disconnect();
    }
  });
});

/**
 * Prisma's `@unique` compiles to `CREATE UNIQUE INDEX`, not `ALTER TABLE ... ADD CONSTRAINT
 * UNIQUE` — so, unlike a primary key, it never gets a `pg_constraint` row and is invisible to
 * information_schema.table_constraints. Reading pg_index directly is what actually sees it.
 */
async function isUniqueColumn(
  db: ReturnType<typeof createDatabase>['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await db.$queryRaw<{ attname: string }[]>`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
    WHERE i.indisunique
      AND array_length(i.indkey, 1) = 1
      AND n.nspname = 'public'
      AND t.relname = ${table}
      AND a.attname = ${column}
  `;
  return rows.length > 0;
}

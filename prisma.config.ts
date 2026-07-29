import { defineConfig } from 'prisma/config';

/**
 * CLI-only configuration for the Prisma toolchain (`prisma generate`, `prisma migrate ...`).
 * The generated client itself is configured separately at runtime via a driver adapter
 * (see packages/db/src/client.ts) — this file only tells the CLI where the schema and
 * migrations for @weather-demo/db live, and which connection string to use for
 * schema-authoring commands (`migrate dev`, `migrate deploy`, `db pull`, ...).
 *
 * DATABASE_URL_OWNER is the same env var the app already uses for the owner/migration
 * connection (see .env.example, docker-compose.yml, and packages/db/src/migrate.ts) — kept
 * as-is so no other file needs to change.
 *
 * Read via plain `process.env` rather than `prisma/config`'s `env()` helper deliberately:
 * `env()` validates eagerly, at config-load time, before the CLI even knows which command is
 * running — so it throws on `prisma generate` (a build-time step, e.g. in the Dockerfiles and
 * CI, that never touches a live database) just as readily as on `migrate deploy` (which
 * genuinely needs it). Commands that actually need a connection still fail clearly when they try
 * to use an unset one.
 */
export default defineConfig({
  schema: 'packages/db/prisma/schema.prisma',
  migrations: {
    path: 'packages/db/prisma/migrations',
  },
  // Conditional spread, not `url: process.env['DATABASE_URL_OWNER']` — under this project's
  // `exactOptionalPropertyTypes`, an optional `url?: string` can't be assigned `string |
  // undefined` directly; omitting the key entirely when unset is what stays type-correct.
  datasource: {
    ...(process.env['DATABASE_URL_OWNER'] ? { url: process.env['DATABASE_URL_OWNER'] } : {}),
  },
});

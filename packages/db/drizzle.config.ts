import { defineConfig } from 'drizzle-kit';

// Connection string for schema generation only. `db:generate` reads this to introspect diffs;
// it never needs a live connection. Migrations are applied at runtime by src/migrate.ts, never
// via `drizzle-kit push` (constitution Principle IV: every schema change is a checked-in
// migration file).
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_OWNER ?? 'postgresql://localhost:5432/weather_demo',
  },
  strict: true,
  verbose: true,
});

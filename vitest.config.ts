import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    testTimeout: 15000,
    // Integration test files across packages/{db,api,ingest} share one live Postgres instance and
    // several independently call runMigrations()/seed() in beforeAll; running files in parallel
    // races those DDL/upsert statements against each other. Sequential file execution trades some
    // wall-clock speed for correctness here, and matches how CI runs the suite (one process).
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          // Non-DOM tests everywhere, including packages/{ui,web}'s own non-component logic
          // (e.g. tokens.test.ts, api-client.test.ts) — only .test.tsx files need jsdom.
          name: 'node',
          environment: 'node',
          include: ['packages/*/src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // ui/web component tests render into the DOM; scoped to their own project so the
          // jsdom cost is only paid for files that need it.
          name: 'dom',
          environment: 'jsdom',
          include: ['packages/{ui,web}/src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});

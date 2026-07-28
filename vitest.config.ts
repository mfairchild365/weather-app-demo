import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    testTimeout: 15000,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/{db,api,ingest}/src/**/*.test.ts'],
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
        },
      },
    ],
  },
});

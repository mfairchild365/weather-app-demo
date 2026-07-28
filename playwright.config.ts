import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against an already-running web service (docker compose, or `npm run dev` in
 * packages/web) — this config does not start one itself, since the stack needs Postgres +
 * ingested data to be meaningful. See README's "End-to-end tests" section.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

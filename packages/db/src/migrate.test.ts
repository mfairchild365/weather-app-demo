import { describe, it, expect } from 'vitest';
import { runMigrations } from './migrate.js';
import { testDatabaseUrl } from './test-utils.js';

describe('runMigrations', () => {
  it('is idempotent: applying the same migrations twice in a row does not throw', async () => {
    const url = testDatabaseUrl();
    await runMigrations(url);
    await expect(runMigrations(url)).resolves.not.toThrow();
  });
});

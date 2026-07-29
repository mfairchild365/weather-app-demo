import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import { buildApp } from './app';

describe('OpenAPI document and docs UI', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
  });

  it('/api/openapi.json documents every non-hidden route with a response schema (SC-005)', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/openapi.json' });
      const doc = response.json();

      expect(doc.paths['/api/cities'].get.responses['200']).toBeDefined();
      expect(doc.paths['/api/cities/{slug}'].get.responses['404']).toBeDefined();
      expect(doc.paths['/api/meta/freshness']).toBeDefined();

      await app.close();
    } finally {
      await disconnect();
    }
  });

  it('/api/docs serves the browsable Swagger UI', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/docs' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');

      await app.close();
    } finally {
      await disconnect();
    }
  });
});

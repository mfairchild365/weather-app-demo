import { describe, it, expect, beforeAll } from 'vitest';
import { createDatabase } from '@weather-demo/db';
import { runMigrations } from '@weather-demo/db/migrate';
import { seed } from '@weather-demo/db/seed';
import { testDatabaseUrl } from '@weather-demo/db/test-utils';
import { buildApp } from './app';

describe('buildApp', () => {
  beforeAll(async () => {
    await runMigrations(testDatabaseUrl());
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      await seed(db);
    } finally {
      await disconnect();
    }
  });

  it('registers no data-mutating route (constitution Principle III, spec FR-007/SC-003)', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      await app.ready();

      // HEAD is Fastify's automatic, non-mutating counterpart to every GET route, and OPTIONS is
      // @fastify/cors's preflight handler — neither can create/modify/delete anything. What
      // FR-007/SC-003 actually forbids is any route accepting POST/PUT/PATCH/DELETE.
      const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
      const mutatingRoutes = app.registeredRoutes.filter((route) =>
        mutatingMethods.has(route.method),
      );
      expect(mutatingRoutes).toEqual([]);
      expect(app.registeredRoutes.some((route) => route.method === 'GET')).toBe(true);

      await app.close();
    } finally {
      await disconnect();
    }
  });

  it('responds with a JSON error body (not HTML/a stack trace) for an unknown route', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/does-not-exist' });

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.json()).toMatchObject({ error: 'not_found' });

      await app.close();
    } finally {
      await disconnect();
    }
  });

  it('serves a valid OpenAPI document (SC-005)', async () => {
    const { db, disconnect } = createDatabase(testDatabaseUrl());
    try {
      const app = await buildApp(db, { logger: false });
      const response = await app.inject({ method: 'GET', url: '/api/openapi.json' });

      expect(response.statusCode).toBe(200);
      const doc = response.json();
      expect(doc.openapi).toMatch(/^3\./);
      expect(doc.paths['/api/cities']).toBeDefined();

      await app.close();
    } finally {
      await disconnect();
    }
  });
});

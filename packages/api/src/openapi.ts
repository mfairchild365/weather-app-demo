import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/**
 * Generates the OpenAPI document from the same zod schemas every route already validates
 * against (spec FR-012 — no hand-maintained duplicate contract), serving it at
 * `/api/openapi.json` and a browsable form at `/api/docs`.
 */
export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'weather-demo API',
        description: 'Read-only weather data for the seeded cities — GET routes only.',
        version: '0.1.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
  });

  app.get('/api/openapi.json', { schema: { hide: true } }, () => app.swagger());
}

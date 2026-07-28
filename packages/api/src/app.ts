import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Database } from '@weather-demo/db';
import { registerOpenApi } from './openapi';
import { healthRoutes } from './routes/health';
import { citiesRoutes } from './routes/cities';
import { metaRoutes } from './routes/meta';
import { badRequestBody, notFoundBody, errorBody } from './errors';
import './types';

export interface RegisteredRoute {
  method: string;
  url: string;
}

export interface BuildAppOptions {
  logger?: boolean;
}

/**
 * Builds (but does not start listening on) the Fastify API. Every route registered here is a
 * `GET` (constitution Principle III / spec FR-007) — `app.registeredRoutes`, populated via the
 * `onRoute` hook below, is what app.test.ts asserts against to enforce that mechanically.
 */
export async function buildApp(
  db: Database,
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const registeredRoutes: RegisteredRoute[] = [];
  app.addHook('onRoute', (routeOptions) => {
    const methods = Array.isArray(routeOptions.method)
      ? routeOptions.method
      : [routeOptions.method];
    for (const method of methods) {
      registeredRoutes.push({ method, url: routeOptions.url });
    }
  });
  app.decorate('registeredRoutes', registeredRoutes);

  app.decorate('db', db);

  await app.register(cors, { origin: true });
  await registerOpenApi(app);

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(notFoundBody(`No route: ${request.method} ${request.url}`));
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    // fastify-type-provider-zod attaches a ZodError as `error.validation`-shaped info; Fastify's
    // own schema-validation failures surface as statusCode 400 with a `validation` array.
    if (error.statusCode === 400 || error.validation) {
      reply.code(400).send(badRequestBody(error.message));
      return;
    }
    request.log.error(error);
    reply.code(error.statusCode ?? 500).send(errorBody('internal_error', 'Something went wrong.'));
  });

  await app.register(healthRoutes);
  await app.register(citiesRoutes);
  await app.register(metaRoutes);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    registeredRoutes: RegisteredRoute[];
  }
}

import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  getCities,
  getCityBySlug,
  getLatestObservation,
  getForecastHourly,
  getForecastDaily,
  getIngestRunById,
} from '@weather-demo/db';
import {
  citySchema,
  cityDetailSchema,
  forecastRangeSchema,
  forecastResponseSchema,
  errorSchema,
} from '../schemas';
import { notFoundBody, badRequestBody } from '../errors';
import {
  serializeCity,
  serializeObservation,
  serializeForecastHourly,
  serializeForecastDaily,
} from '../serializers';
import '../types';

const slugParamsSchema = z.object({ slug: z.string() });
const forecastQuerySchema = z.object({ range: forecastRangeSchema });

export const citiesRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/api/cities',
    {
      schema: {
        tags: ['cities'],
        response: { 200: z.array(citySchema) },
      },
    },
    async () => {
      const cities = await getCities(fastify.db);
      return cities.map(serializeCity);
    },
  );

  app.get(
    '/api/cities/:slug',
    {
      schema: {
        tags: ['cities'],
        params: slugParamsSchema,
        response: { 200: cityDetailSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const city = await getCityBySlug(fastify.db, request.params.slug);
      if (!city) {
        return reply.code(404).send(notFoundBody(`No city with slug "${request.params.slug}"`));
      }
      const latest = await getLatestObservation(fastify.db, city.id);
      // dataAsOf is the ingest run's own finishedAt, not the observation's observedAt — those can
      // differ (spec Acceptance Scenario: "the response includes the ingest_runs timestamp its
      // observation came from"), and this is the field that answers "when did we last refresh?".
      const ingestRun = latest ? await getIngestRunById(fastify.db, latest.ingestRunId) : undefined;
      return {
        ...serializeCity(city),
        latestObservation: latest ? serializeObservation(latest) : null,
        dataAsOf: ingestRun?.finishedAt ? ingestRun.finishedAt.toISOString() : null,
      };
    },
  );

  app.get(
    '/api/cities/:slug/forecast',
    {
      schema: {
        tags: ['cities'],
        params: slugParamsSchema,
        querystring: forecastQuerySchema,
        response: { 200: forecastResponseSchema, 400: errorSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const city = await getCityBySlug(fastify.db, request.params.slug);
      if (!city) {
        return reply.code(404).send(notFoundBody(`No city with slug "${request.params.slug}"`));
      }

      const { range } = request.query;
      if (range === 'hourly') {
        const rows = await getForecastHourly(fastify.db, city.id);
        return { range, rows: rows.map(serializeForecastHourly) };
      }
      if (range === 'daily') {
        const rows = await getForecastDaily(fastify.db, city.id);
        return { range, rows: rows.map(serializeForecastDaily) };
      }
      // Unreachable: forecastRangeSchema restricts `range` to 'hourly' | 'daily' — Fastify
      // rejects any other value with a 400 before the handler runs (spec FR-010).
      return reply.code(400).send(badRequestBody('range must be "hourly" or "daily"'));
    },
  );
};

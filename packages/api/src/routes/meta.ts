import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { getProviderByKey, getLatestSuccessfulIngestRun } from '@weather-demo/db';
import { freshnessSchema } from '../schemas';
import '../types';

export const metaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/api/meta/freshness',
    {
      schema: {
        tags: ['meta'],
        response: { 200: freshnessSchema },
      },
    },
    async () => {
      const provider = await getProviderByKey(fastify.db, 'open-meteo');
      const latestRun = await getLatestSuccessfulIngestRun(fastify.db);
      return {
        provider: provider?.name ?? 'open-meteo',
        lastSuccessfulRunAt: latestRun?.finishedAt ? latestRun.finishedAt.toISOString() : null,
      };
    },
  );
};

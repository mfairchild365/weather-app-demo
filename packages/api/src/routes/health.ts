import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { healthSchema } from '../schemas';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/api/health',
    {
      schema: {
        tags: ['meta'],
        response: { 200: healthSchema },
      },
    },
    async () => ({ status: 'ok' as const }),
  );
};

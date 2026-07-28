import type { Database } from '@weather-demo/db';

// Every route reaches the database through `fastify.db`, set once via `fastify.decorate` in
// app.ts — never through a module-level singleton, so tests can build an app instance per seeded
// test database.
declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

import { createDatabase, requireEnv } from '@weather-demo/db';
import { buildApp } from './app';

async function main(): Promise<void> {
  // Connects with the weather_api role only — SELECT everywhere, nothing else (constitution
  // Principle III; spec FR-008).
  const { db } = createDatabase(requireEnv('DATABASE_URL_API'));
  const app = await buildApp(db);

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen({ host: '0.0.0.0', port });
}

main().catch((error: unknown) => {
  console.error('API failed to start:', error);
  process.exitCode = 1;
});

import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { providers } from '../schema/providers';

export type ProviderRow = typeof providers.$inferSelect;

/** A provider by its stable key (e.g. `open-meteo`), or undefined if it hasn't been seeded. */
export async function getProviderByKey(
  db: Database,
  key: string,
): Promise<ProviderRow | undefined> {
  const rows = await db.select().from(providers).where(eq(providers.key, key)).limit(1);
  return rows[0];
}

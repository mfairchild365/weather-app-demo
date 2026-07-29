import type { Database } from '../client';

export interface ProviderRow {
  id: number;
  key: string;
  name: string;
  attributionUrl: string;
  license: string;
  createdAt: Date;
}

/** A provider by its stable key (e.g. `open-meteo`), or undefined if it hasn't been seeded. */
export async function getProviderByKey(
  db: Database,
  key: string,
): Promise<ProviderRow | undefined> {
  const row = await db.provider.findUnique({ where: { key } });
  return row ?? undefined;
}

import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { regions } from '../schema/regions';
import { cities } from '../schema/cities';
import { observations } from '../schema/observations';
import { forecastHourly, forecastDaily } from '../schema/forecasts';

/**
 * Inserts (or reuses, if already present from an earlier run) a city under a dedicated "ZZ" test
 * region, isolated from the real seeded cities — and always clears any observation/forecast rows
 * it may already have, so every call starts that city with a known-empty history.
 *
 * Two things make this necessary, not just convenient:
 * - Several test files across packages/{db,ingest,api} share one live TEST_DATABASE_URL (see
 *   vitest.config.ts's fileParallelism note), and packages/ingest's cycle.test.ts genuinely
 *   ingests fixture data for *every* row `getCities()` returns — including any test city another
 *   file has already inserted in the same run. Reusing a seeded city like "portland-us" would be
 *   fragile for the same reason.
 * - Re-running `npm test` locally against a database from a previous run (rather than a fresh
 *   `postgres:16` container, as CI always provides) would otherwise reuse a city row that a prior
 *   run's cycle.test.ts already gave an observation to — the clearing step below is what keeps
 *   "no data yet" tests true on a second local run, not just the first.
 */
export async function insertTestCity(db: Database, slug: string, name: string): Promise<number> {
  const existing = await db.select({ id: cities.id }).from(cities).where(eq(cities.slug, slug));
  const existingRow = existing[0];

  const cityId =
    existingRow?.id ??
    (await (async () => {
      const [region] = await db
        .insert(regions)
        .values({ name: 'DB Test Region', code: 'ZZ' })
        .onConflictDoUpdate({ target: regions.code, set: { name: 'DB Test Region' } })
        .returning({ id: regions.id });
      if (!region) throw new Error('failed to insert test region');

      const [city] = await db
        .insert(cities)
        .values({
          regionId: region.id,
          name,
          slug,
          latitude: '0.00000',
          longitude: '0.00000',
          timezone: 'UTC',
        })
        .returning({ id: cities.id });
      if (!city) throw new Error('failed to insert test city');
      return city.id;
    })());

  await db.delete(observations).where(eq(observations.cityId, cityId));
  await db.delete(forecastHourly).where(eq(forecastHourly.cityId, cityId));
  await db.delete(forecastDaily).where(eq(forecastDaily.cityId, cityId));

  return cityId;
}

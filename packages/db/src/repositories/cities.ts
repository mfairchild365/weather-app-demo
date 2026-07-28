import { eq } from 'drizzle-orm';
import type { Database } from '../client';
import { cities } from '../schema/cities';
import { regions } from '../schema/regions';

export interface CityWithRegion {
  id: number;
  slug: string;
  name: string;
  latitude: string;
  longitude: string;
  timezone: string;
  region: { name: string; code: string };
}

function selectCityWithRegion(db: Database) {
  return db
    .select({
      id: cities.id,
      slug: cities.slug,
      name: cities.name,
      latitude: cities.latitude,
      longitude: cities.longitude,
      timezone: cities.timezone,
      regionName: regions.name,
      regionCode: regions.code,
    })
    .from(cities)
    .innerJoin(regions, eq(cities.regionId, regions.id));
}

function toCityWithRegion(row: {
  id: number;
  slug: string;
  name: string;
  latitude: string;
  longitude: string;
  timezone: string;
  regionName: string;
  regionCode: string;
}): CityWithRegion {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    region: { name: row.regionName, code: row.regionCode },
  };
}

/** All cities, joined with their region, ordered by name. */
export async function getCities(db: Database): Promise<CityWithRegion[]> {
  const rows = await selectCityWithRegion(db).orderBy(cities.name);
  return rows.map(toCityWithRegion);
}

/** A single city by its URL-safe slug, or undefined if no such city exists. */
export async function getCityBySlug(
  db: Database,
  slug: string,
): Promise<CityWithRegion | undefined> {
  const rows = await selectCityWithRegion(db).where(eq(cities.slug, slug)).limit(1);
  const row = rows[0];
  return row ? toCityWithRegion(row) : undefined;
}

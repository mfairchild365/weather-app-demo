import type { Database } from '../client';
import type { Prisma } from '../generated/prisma/client';
import { decimalToString } from '../decimal';

export interface CityWithRegion {
  id: number;
  slug: string;
  name: string;
  latitude: string;
  longitude: string;
  timezone: string;
  region: { name: string; code: string };
}

interface CityWithRegionRow {
  id: number;
  slug: string;
  name: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  timezone: string;
  region: { name: string; code: string };
}

function toCityWithRegion(row: CityWithRegionRow): CityWithRegion {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    // city.latitude/longitude are Decimal(8, 5) — see prisma/schema.prisma.
    latitude: decimalToString(row.latitude, 5),
    longitude: decimalToString(row.longitude, 5),
    timezone: row.timezone,
    region: { name: row.region.name, code: row.region.code },
  };
}

const regionSelect = { select: { name: true, code: true } } as const;

/** All cities, joined with their region, ordered by name. */
export async function getCities(db: Database): Promise<CityWithRegion[]> {
  const rows = await db.city.findMany({
    include: { region: regionSelect },
    orderBy: { name: 'asc' },
  });
  return rows.map(toCityWithRegion);
}

/** A single city by its URL-safe slug, or undefined if no such city exists. */
export async function getCityBySlug(
  db: Database,
  slug: string,
): Promise<CityWithRegion | undefined> {
  const row = await db.city.findUnique({
    where: { slug },
    include: { region: regionSelect },
  });
  return row ? toCityWithRegion(row) : undefined;
}

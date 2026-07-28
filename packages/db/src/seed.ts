import { createDatabase, requireEnv, type Database } from './client';
import { regions, cities, providers, measurementTypes, units, providerUnits } from './schema/index';
import { weatherCodes } from './schema/lookups';
import {
  REGIONS,
  CITIES,
  PROVIDERS,
  MEASUREMENT_TYPES,
  UNITS,
  PROVIDER_UNIT_ASSIGNMENTS,
  WEATHER_CODES,
} from './seed-data';

/**
 * Idempotent seed: every insert upserts on the table's natural unique key, so running this twice
 * yields the same row count both times (spec FR-008, tasks.md T017).
 */
export async function seed(db: Database): Promise<void> {
  for (const code of WEATHER_CODES) {
    await db
      .insert(weatherCodes)
      .values(code)
      .onConflictDoUpdate({
        target: weatherCodes.code,
        set: { label: code.label, iconKey: code.iconKey },
      });
  }

  for (const provider of PROVIDERS) {
    await db
      .insert(providers)
      .values(provider)
      .onConflictDoUpdate({ target: providers.key, set: { name: provider.name } });
  }

  for (const measurementType of MEASUREMENT_TYPES) {
    await db
      .insert(measurementTypes)
      .values(measurementType)
      .onConflictDoUpdate({
        target: measurementTypes.key,
        set: { displayName: measurementType.displayName },
      });
  }

  const measurementTypeRows = await db.select().from(measurementTypes);
  const measurementTypeIdByKey = new Map(measurementTypeRows.map((row) => [row.key, row.id]));

  for (const unit of UNITS) {
    const measurementTypeId = measurementTypeIdByKey.get(unit.measurementTypeKey);
    if (!measurementTypeId) {
      throw new Error(`Unknown measurement type key in seed data: ${unit.measurementTypeKey}`);
    }
    await db
      .insert(units)
      .values({
        key: unit.key,
        measurementTypeId,
        symbol: unit.symbol,
        displayName: unit.displayName,
      })
      .onConflictDoUpdate({ target: units.key, set: { symbol: unit.symbol } });
  }

  const providerRows = await db.select().from(providers);
  const providerIdByKey = new Map(providerRows.map((row) => [row.key, row.id]));
  const unitRows = await db.select().from(units);
  const unitIdByKey = new Map(unitRows.map((row) => [row.key, row.id]));

  for (const assignment of PROVIDER_UNIT_ASSIGNMENTS) {
    const providerId = providerIdByKey.get(assignment.providerKey);
    const measurementTypeId = measurementTypeIdByKey.get(assignment.measurementTypeKey);
    const unitId = unitIdByKey.get(assignment.unitKey);
    if (!providerId || !measurementTypeId || !unitId) {
      throw new Error(`Could not resolve provider-unit assignment: ${JSON.stringify(assignment)}`);
    }
    await db
      .insert(providerUnits)
      .values({ providerId, measurementTypeId, unitId })
      .onConflictDoUpdate({
        target: [providerUnits.providerId, providerUnits.measurementTypeId],
        set: { unitId },
      });
  }

  for (const region of REGIONS) {
    await db
      .insert(regions)
      .values(region)
      .onConflictDoUpdate({ target: regions.code, set: { name: region.name } });
  }

  const regionRows = await db.select().from(regions);
  const regionIdByCode = new Map(regionRows.map((row) => [row.code, row.id]));

  for (const city of CITIES) {
    const regionId = regionIdByCode.get(city.regionCode);
    if (!regionId) {
      throw new Error(`Unknown region code in seed data: ${city.regionCode}`);
    }
    await db
      .insert(cities)
      .values({
        regionId,
        name: city.name,
        slug: city.slug,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      })
      .onConflictDoUpdate({
        target: cities.slug,
        set: { name: city.name, latitude: city.latitude, longitude: city.longitude },
      });
  }
}

async function main(): Promise<void> {
  const { db, pool } = createDatabase(requireEnv('DATABASE_URL_OWNER'));
  try {
    await seed(db);
    const cityRows = await db.select({ id: cities.id }).from(cities);
    console.log(`Seed complete. ${cityRows.length} cities present.`);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  });
}

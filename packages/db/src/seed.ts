import { createDatabase, requireEnv, type Database } from './client';
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
    await db.weatherCode.upsert({
      where: { code: code.code },
      create: code,
      update: { label: code.label, iconKey: code.iconKey },
    });
  }

  for (const provider of PROVIDERS) {
    await db.provider.upsert({
      where: { key: provider.key },
      create: provider,
      update: { name: provider.name },
    });
  }

  for (const measurementType of MEASUREMENT_TYPES) {
    await db.measurementType.upsert({
      where: { key: measurementType.key },
      create: measurementType,
      update: { displayName: measurementType.displayName },
    });
  }

  const measurementTypeRows = await db.measurementType.findMany();
  const measurementTypeIdByKey = new Map(measurementTypeRows.map((row) => [row.key, row.id]));

  for (const unit of UNITS) {
    const measurementTypeId = measurementTypeIdByKey.get(unit.measurementTypeKey);
    if (!measurementTypeId) {
      throw new Error(`Unknown measurement type key in seed data: ${unit.measurementTypeKey}`);
    }
    await db.unit.upsert({
      where: { key: unit.key },
      create: {
        key: unit.key,
        measurementTypeId,
        symbol: unit.symbol,
        displayName: unit.displayName,
      },
      update: { symbol: unit.symbol },
    });
  }

  const providerRows = await db.provider.findMany();
  const providerIdByKey = new Map(providerRows.map((row) => [row.key, row.id]));
  const unitRows = await db.unit.findMany();
  const unitIdByKey = new Map(unitRows.map((row) => [row.key, row.id]));

  for (const assignment of PROVIDER_UNIT_ASSIGNMENTS) {
    const providerId = providerIdByKey.get(assignment.providerKey);
    const measurementTypeId = measurementTypeIdByKey.get(assignment.measurementTypeKey);
    const unitId = unitIdByKey.get(assignment.unitKey);
    if (!providerId || !measurementTypeId || !unitId) {
      throw new Error(`Could not resolve provider-unit assignment: ${JSON.stringify(assignment)}`);
    }
    await db.providerUnit.upsert({
      where: { providerId_measurementTypeId: { providerId, measurementTypeId } },
      create: { providerId, measurementTypeId, unitId },
      update: { unitId },
    });
  }

  for (const region of REGIONS) {
    await db.region.upsert({
      where: { code: region.code },
      create: region,
      update: { name: region.name },
    });
  }

  const regionRows = await db.region.findMany();
  const regionIdByCode = new Map(regionRows.map((row) => [row.code, row.id]));

  for (const city of CITIES) {
    const regionId = regionIdByCode.get(city.regionCode);
    if (!regionId) {
      throw new Error(`Unknown region code in seed data: ${city.regionCode}`);
    }
    await db.city.upsert({
      where: { slug: city.slug },
      create: {
        regionId,
        name: city.name,
        slug: city.slug,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      },
      update: { name: city.name, latitude: city.latitude, longitude: city.longitude },
    });
  }
}

async function main(): Promise<void> {
  const { db, disconnect } = createDatabase(requireEnv('DATABASE_URL_OWNER'));
  try {
    await seed(db);
    const cityCount = await db.city.count();
    console.log(`Seed complete. ${cityCount} cities present.`);
  } finally {
    await disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  });
}

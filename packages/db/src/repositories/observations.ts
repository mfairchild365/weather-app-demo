import type { Database } from '../client';
import type { Prisma } from '../generated/prisma/client';
import { decimalToString } from '../decimal';

export interface ObservationInput {
  cityId: number;
  ingestRunId: number;
  observedAt: Date;
  temperature: string;
  windSpeed: string;
  windDirection: string | null;
  humidity: string | null;
  pressure: string | null;
  precipitation: string | null;
  weatherCode: number;
  isDay: boolean;
}

export interface ObservationRow {
  cityId: number;
  ingestRunId: number;
  observedAt: Date;
  temperature: string;
  windSpeed: string;
  windDirection: string | null;
  humidity: string | null;
  pressure: string | null;
  precipitation: string | null;
  weatherCode: number;
  /** Human-readable label for `weatherCode`, joined from weather_codes — never duplicated as a
   * hardcoded lookup on the client, per the constitution's normalized-schema principle. */
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

interface ObservationWithWeatherCodeRow {
  cityId: number;
  ingestRunId: number;
  observedAt: Date;
  temperature: Prisma.Decimal;
  windSpeed: Prisma.Decimal;
  windDirection: Prisma.Decimal | null;
  humidity: Prisma.Decimal | null;
  pressure: Prisma.Decimal | null;
  precipitation: Prisma.Decimal | null;
  weatherCode: number;
  isDay: boolean;
  weatherCodeRef: { label: string; iconKey: string };
}

// Numeric precision/scale per prisma/schema.prisma's Observation model.
function toObservationRow(row: ObservationWithWeatherCodeRow): ObservationRow {
  return {
    cityId: row.cityId,
    ingestRunId: row.ingestRunId,
    observedAt: row.observedAt,
    temperature: decimalToString(row.temperature, 2),
    windSpeed: decimalToString(row.windSpeed, 2),
    windDirection: decimalToString(row.windDirection, 1),
    humidity: decimalToString(row.humidity, 2),
    pressure: decimalToString(row.pressure, 2),
    precipitation: decimalToString(row.precipitation, 2),
    weatherCode: row.weatherCode,
    weatherLabel: row.weatherCodeRef.label,
    weatherIconKey: row.weatherCodeRef.iconKey,
    isDay: row.isDay,
  };
}

/** The most recent observation for a city, or undefined if none have been ingested yet. */
export async function getLatestObservation(
  db: Database,
  cityId: number,
): Promise<ObservationRow | undefined> {
  const row = await db.observation.findFirst({
    where: { cityId },
    orderBy: { observedAt: 'desc' },
    include: { weatherCodeRef: { select: { label: true, iconKey: true } } },
  });
  return row ? toObservationRow(row) : undefined;
}

/**
 * Insert or update an observation for a city at a point in time, keyed on the (city, observed_at)
 * unique constraint — re-ingesting the same instant updates the row rather than duplicating it.
 */
export async function upsertObservation(db: Database, row: ObservationInput): Promise<void> {
  const shared = {
    ingestRunId: row.ingestRunId,
    temperature: row.temperature,
    windSpeed: row.windSpeed,
    windDirection: row.windDirection,
    humidity: row.humidity,
    pressure: row.pressure,
    precipitation: row.precipitation,
    weatherCode: row.weatherCode,
    isDay: row.isDay,
  };
  await db.observation.upsert({
    where: { cityId_observedAt: { cityId: row.cityId, observedAt: row.observedAt } },
    create: { cityId: row.cityId, observedAt: row.observedAt, ...shared },
    update: shared,
  });
}

import type { Database } from '../client';
import type { Prisma } from '../generated/prisma/client';
import { decimalToString } from '../decimal';

export interface ForecastHourlyInput {
  cityId: number;
  ingestRunId: number;
  validAt: Date;
  temperature: string;
  windSpeed: string | null;
  windDirection: string | null;
  humidity: string | null;
  precipitation: string | null;
  precipitationProbability: string | null;
  weatherCode: number;
  isDay: boolean;
}

export interface ForecastDailyInput {
  cityId: number;
  ingestRunId: number;
  validDate: string;
  temperatureMin: string;
  temperatureMax: string;
  windSpeedMax: string | null;
  precipitationSum: string | null;
  precipitationProbabilityMax: string | null;
  weatherCode: number;
  sunrise: Date | null;
  sunset: Date | null;
}

export interface ForecastHourlyRow {
  cityId: number;
  ingestRunId: number;
  validAt: Date;
  temperature: string;
  windSpeed: string | null;
  windDirection: string | null;
  humidity: string | null;
  precipitation: string | null;
  precipitationProbability: string | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  isDay: boolean;
}

export interface ForecastDailyRow {
  cityId: number;
  ingestRunId: number;
  validDate: string;
  temperatureMin: string;
  temperatureMax: string;
  windSpeedMax: string | null;
  precipitationSum: string | null;
  precipitationProbabilityMax: string | null;
  weatherCode: number;
  weatherLabel: string;
  weatherIconKey: string;
  sunrise: Date | null;
  sunset: Date | null;
}

interface ForecastHourlyWithWeatherCodeRow {
  cityId: number;
  ingestRunId: number;
  validAt: Date;
  temperature: Prisma.Decimal;
  windSpeed: Prisma.Decimal | null;
  windDirection: Prisma.Decimal | null;
  humidity: Prisma.Decimal | null;
  precipitation: Prisma.Decimal | null;
  precipitationProbability: Prisma.Decimal | null;
  weatherCode: number;
  isDay: boolean;
  weatherCodeRef: { label: string; iconKey: string };
}

interface ForecastDailyWithWeatherCodeRow {
  cityId: number;
  ingestRunId: number;
  validDate: Date;
  temperatureMin: Prisma.Decimal;
  temperatureMax: Prisma.Decimal;
  windSpeedMax: Prisma.Decimal | null;
  precipitationSum: Prisma.Decimal | null;
  precipitationProbabilityMax: Prisma.Decimal | null;
  weatherCode: number;
  sunrise: Date | null;
  sunset: Date | null;
  weatherCodeRef: { label: string; iconKey: string };
}

const weatherCodeSelect = { select: { label: true, iconKey: true } } as const;

/** Postgres `date` columns come back from Prisma as UTC-midnight `Date` instances; format back
 * to the plain `YYYY-MM-DD` string every caller of this repository already expects. */
function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The inverse of `toDateOnlyString` — a plain `YYYY-MM-DD` string is accepted in `create`/
 * `update` input, but the compound-unique `where` filter Prisma generates for `@@unique` requires
 * a full `Date`, not a bare date string (it rejects the latter as "premature end of input.
 * Expected ISO-8601 DateTime"). Parsed as UTC midnight to match how Postgres's `date` type and
 * Prisma read it back. */
function toDateOnly(validDate: string): Date {
  return new Date(`${validDate}T00:00:00.000Z`);
}

// Numeric precision/scale per prisma/schema.prisma's ForecastHourly model.
function toForecastHourlyRow(row: ForecastHourlyWithWeatherCodeRow): ForecastHourlyRow {
  return {
    cityId: row.cityId,
    ingestRunId: row.ingestRunId,
    validAt: row.validAt,
    temperature: decimalToString(row.temperature, 2),
    windSpeed: decimalToString(row.windSpeed, 2),
    windDirection: decimalToString(row.windDirection, 1),
    humidity: decimalToString(row.humidity, 2),
    precipitation: decimalToString(row.precipitation, 2),
    precipitationProbability: decimalToString(row.precipitationProbability, 2),
    weatherCode: row.weatherCode,
    weatherLabel: row.weatherCodeRef.label,
    weatherIconKey: row.weatherCodeRef.iconKey,
    isDay: row.isDay,
  };
}

// Numeric precision/scale per prisma/schema.prisma's ForecastDaily model.
function toForecastDailyRow(row: ForecastDailyWithWeatherCodeRow): ForecastDailyRow {
  return {
    cityId: row.cityId,
    ingestRunId: row.ingestRunId,
    validDate: toDateOnlyString(row.validDate),
    temperatureMin: decimalToString(row.temperatureMin, 2),
    temperatureMax: decimalToString(row.temperatureMax, 2),
    windSpeedMax: decimalToString(row.windSpeedMax, 2),
    precipitationSum: decimalToString(row.precipitationSum, 2),
    precipitationProbabilityMax: decimalToString(row.precipitationProbabilityMax, 2),
    weatherCode: row.weatherCode,
    weatherLabel: row.weatherCodeRef.label,
    weatherIconKey: row.weatherCodeRef.iconKey,
    sunrise: row.sunrise,
    sunset: row.sunset,
  };
}

/**
 * Hourly forecast rows for a city, ordered by valid time ascending. Joined with weather_codes so
 * callers get a human-readable label — never duplicated as a hardcoded lookup on the client.
 */
export async function getForecastHourly(
  db: Database,
  cityId: number,
): Promise<ForecastHourlyRow[]> {
  const rows = await db.forecastHourly.findMany({
    where: { cityId },
    orderBy: { validAt: 'asc' },
    include: { weatherCodeRef: weatherCodeSelect },
  });
  return rows.map(toForecastHourlyRow);
}

/** Daily forecast rows for a city, ordered by valid date ascending. Joined as above. */
export async function getForecastDaily(db: Database, cityId: number): Promise<ForecastDailyRow[]> {
  const rows = await db.forecastDaily.findMany({
    where: { cityId },
    orderBy: { validDate: 'asc' },
    include: { weatherCodeRef: weatherCodeSelect },
  });
  return rows.map(toForecastDailyRow);
}

/**
 * Bulk insert-or-update hourly forecast rows, keyed on the (city, valid_at) unique constraint —
 * re-ingesting the same hour updates it rather than duplicating it. A no-op on an empty array.
 * Runs as one transaction rather than one round trip per row (a full ingest cycle upserts dozens
 * of hourly rows per city).
 */
export async function upsertForecastHourly(
  db: Database,
  rows: ForecastHourlyInput[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.$transaction(
    rows.map((row) => {
      const shared = {
        ingestRunId: row.ingestRunId,
        temperature: row.temperature,
        windSpeed: row.windSpeed,
        windDirection: row.windDirection,
        humidity: row.humidity,
        precipitation: row.precipitation,
        precipitationProbability: row.precipitationProbability,
        weatherCode: row.weatherCode,
        isDay: row.isDay,
      };
      return db.forecastHourly.upsert({
        where: { cityId_validAt: { cityId: row.cityId, validAt: row.validAt } },
        create: { cityId: row.cityId, validAt: row.validAt, ...shared },
        update: shared,
      });
    }),
  );
}

/**
 * Bulk insert-or-update daily forecast rows, keyed on the (city, valid_date) unique constraint.
 * A no-op on an empty array.
 */
export async function upsertForecastDaily(db: Database, rows: ForecastDailyInput[]): Promise<void> {
  if (rows.length === 0) return;
  await db.$transaction(
    rows.map((row) => {
      const shared = {
        ingestRunId: row.ingestRunId,
        temperatureMin: row.temperatureMin,
        temperatureMax: row.temperatureMax,
        windSpeedMax: row.windSpeedMax,
        precipitationSum: row.precipitationSum,
        precipitationProbabilityMax: row.precipitationProbabilityMax,
        weatherCode: row.weatherCode,
        sunrise: row.sunrise,
        sunset: row.sunset,
      };
      const validDate = toDateOnly(row.validDate);
      return db.forecastDaily.upsert({
        where: { cityId_validDate: { cityId: row.cityId, validDate } },
        create: { cityId: row.cityId, validDate, ...shared },
        update: shared,
      });
    }),
  );
}

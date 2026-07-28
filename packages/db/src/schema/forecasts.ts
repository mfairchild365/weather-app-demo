import {
  pgTable,
  serial,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { ingestRuns } from './ingest-runs';
import { weatherCodes } from './lookups';

/**
 * An hourly forecast row for a city at a specific valid hour. Unique on (city, valid_at) so
 * re-ingestion upserts the same hour rather than duplicating it.
 */
export const forecastHourly = pgTable(
  'forecast_hourly',
  {
    id: serial('id').primaryKey(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    ingestRunId: integer('ingest_run_id')
      .notNull()
      .references(() => ingestRuns.id),
    validAt: timestamp('valid_at', { withTimezone: true }).notNull(),
    temperature: numeric('temperature', { precision: 5, scale: 2 }).notNull(),
    windSpeed: numeric('wind_speed', { precision: 5, scale: 2 }),
    windDirection: numeric('wind_direction', { precision: 5, scale: 1 }),
    humidity: numeric('humidity', { precision: 5, scale: 2 }),
    precipitation: numeric('precipitation', { precision: 6, scale: 2 }),
    precipitationProbability: numeric('precipitation_probability', { precision: 5, scale: 2 }),
    weatherCode: integer('weather_code')
      .notNull()
      .references(() => weatherCodes.code),
    isDay: boolean('is_day').notNull(),
  },
  (table) => [uniqueIndex('forecast_hourly_city_valid_at_idx').on(table.cityId, table.validAt)],
);

/**
 * A daily forecast row for a city on a specific valid date. Unique on (city, valid_date) so
 * re-ingestion upserts the same day rather than duplicating it.
 */
export const forecastDaily = pgTable(
  'forecast_daily',
  {
    id: serial('id').primaryKey(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    ingestRunId: integer('ingest_run_id')
      .notNull()
      .references(() => ingestRuns.id),
    validDate: date('valid_date').notNull(),
    temperatureMin: numeric('temperature_min', { precision: 5, scale: 2 }).notNull(),
    temperatureMax: numeric('temperature_max', { precision: 5, scale: 2 }).notNull(),
    windSpeedMax: numeric('wind_speed_max', { precision: 5, scale: 2 }),
    precipitationSum: numeric('precipitation_sum', { precision: 6, scale: 2 }),
    precipitationProbabilityMax: numeric('precipitation_probability_max', {
      precision: 5,
      scale: 2,
    }),
    weatherCode: integer('weather_code')
      .notNull()
      .references(() => weatherCodes.code),
    sunrise: timestamp('sunrise', { withTimezone: true }),
    sunset: timestamp('sunset', { withTimezone: true }),
  },
  (table) => [uniqueIndex('forecast_daily_city_valid_date_idx').on(table.cityId, table.validDate)],
);

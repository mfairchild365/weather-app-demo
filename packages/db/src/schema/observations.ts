import {
  pgTable,
  serial,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { ingestRuns } from './ingest-runs';
import { weatherCodes } from './lookups';

/**
 * A single current-conditions reading for a city at a point in time. Units for every numeric
 * column here are resolved via `providerUnits`, keyed by the ingest run's provider — not stored
 * per row. Unique on (city, observed_at) so a re-ingested reading for the same instant upserts.
 */
export const observations = pgTable(
  'observations',
  {
    id: serial('id').primaryKey(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),
    ingestRunId: integer('ingest_run_id')
      .notNull()
      .references(() => ingestRuns.id),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    temperature: numeric('temperature', { precision: 5, scale: 2 }).notNull(),
    windSpeed: numeric('wind_speed', { precision: 5, scale: 2 }).notNull(),
    windDirection: numeric('wind_direction', { precision: 5, scale: 1 }),
    humidity: numeric('humidity', { precision: 5, scale: 2 }),
    pressure: numeric('pressure', { precision: 6, scale: 2 }),
    precipitation: numeric('precipitation', { precision: 6, scale: 2 }),
    weatherCode: integer('weather_code')
      .notNull()
      .references(() => weatherCodes.code),
    isDay: boolean('is_day').notNull(),
  },
  (table) => [uniqueIndex('observations_city_observed_at_idx').on(table.cityId, table.observedAt)],
);

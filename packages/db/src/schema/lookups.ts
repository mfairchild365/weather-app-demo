import { pgTable, serial, integer, text, primaryKey } from 'drizzle-orm/pg-core';
import { providers } from './providers';

/**
 * WMO weather interpretation codes (the fixed, documented code set used by Open-Meteo and most
 * other providers). Referenced by FK from observations/forecasts — never denormalized to a text
 * column on those rows.
 */
export const weatherCodes = pgTable('weather_codes', {
  code: integer('code').primaryKey(),
  label: text('label').notNull(),
  iconKey: text('icon_key').notNull(),
});

/**
 * The kinds of numeric measurement this system records (temperature, wind speed, ...). Numeric
 * columns on observations/forecasts are named without a unit suffix (e.g. `temperature`, not
 * `temperature_celsius`); the unit each provider expresses that measurement in is recorded once,
 * in `providerUnits`, rather than duplicated per row.
 */
export const measurementTypes = pgTable('measurement_types', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  displayName: text('display_name').notNull(),
});

/** A concrete unit (Celsius, km/h, mm, ...) that belongs to exactly one measurement type. */
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  measurementTypeId: integer('measurement_type_id')
    .notNull()
    .references(() => measurementTypes.id),
  key: text('key').notNull().unique(),
  symbol: text('symbol').notNull(),
  displayName: text('display_name').notNull(),
});

/**
 * Which unit a given provider uses for a given measurement type. The ingest pipeline always
 * requests the same units from a provider, so this is recorded once per (provider, measurement)
 * pair rather than on every observation/forecast row.
 */
export const providerUnits = pgTable(
  'provider_units',
  {
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id),
    measurementTypeId: integer('measurement_type_id')
      .notNull()
      .references(() => measurementTypes.id),
    unitId: integer('unit_id')
      .notNull()
      .references(() => units.id),
  },
  (table) => [primaryKey({ columns: [table.providerId, table.measurementTypeId] })],
);

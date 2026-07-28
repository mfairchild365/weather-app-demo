import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** A weather data source. Referenced by ingest runs so no source string is duplicated on rows. */
export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  attributionUrl: text('attribution_url').notNull(),
  license: text('license').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

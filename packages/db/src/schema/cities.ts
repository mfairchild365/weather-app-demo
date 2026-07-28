import { pgTable, serial, integer, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { regions } from './regions';

/** A named location, the unit of navigation for every forecast-browsing feature. */
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  regionId: integer('region_id')
    .notNull()
    .references(() => regions.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  latitude: numeric('latitude', { precision: 8, scale: 5 }).notNull(),
  longitude: numeric('longitude', { precision: 8, scale: 5 }).notNull(),
  timezone: text('timezone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

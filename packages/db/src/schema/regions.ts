import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** A country or administrative area a city belongs to. */
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

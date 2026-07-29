import type { Prisma } from './generated/prisma/client';

/**
 * Normalizes a Prisma `Decimal` to the fixed-point string every repository row interface exposes
 * numeric columns as — the same string the `pg` driver returned for a Postgres `numeric` column
 * under the previous Drizzle client (e.g. `"23.00"` for a `numeric(5,2)` value, not `"23"`).
 *
 * `Decimal#toString()` normalizes away trailing zeros (decimal.js canonicalizes its internal
 * value), so it cannot be used directly here — `scale` must match the column's declared
 * `@db.Decimal(precision, scale)` so `toFixed` reproduces the exact string the column stores.
 * Never let a `Decimal` instance itself escape packages/db — every repository converts at the
 * query boundary, before returning its row interface.
 */
export function decimalToString(value: Prisma.Decimal, scale: number): string;
export function decimalToString(value: Prisma.Decimal | null, scale: number): string | null;
export function decimalToString(value: Prisma.Decimal | null, scale: number): string | null {
  return value === null ? null : value.toFixed(scale);
}

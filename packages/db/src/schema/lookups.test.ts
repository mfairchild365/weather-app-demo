import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { weatherCodes, measurementTypes, units, providerUnits } from './lookups.js';

describe('lookup schema shape', () => {
  it('weather_codes has no free-text duplication of a code elsewhere — it is the single source', () => {
    expect(getTableName(weatherCodes)).toBe('weather_codes');
    const columns = getTableColumns(weatherCodes);
    expect(Object.keys(columns)).toEqual(['code', 'label', 'iconKey']);
    expect(columns.code.primary).toBe(true);
  });

  it('measurement_types has a unique key, not just a display name', () => {
    const columns = getTableColumns(measurementTypes);
    expect(columns.key.isUnique).toBe(true);
  });

  it('units are scoped to exactly one measurement type via FK, not a free-text category', () => {
    const columns = getTableColumns(units);
    expect(columns.measurementTypeId.notNull).toBe(true);
    expect(columns.key.isUnique).toBe(true);
  });

  it('provider_units keys the (provider, measurement) pair to a single unit', () => {
    const columns = getTableColumns(providerUnits);
    expect(Object.keys(columns)).toEqual(['providerId', 'measurementTypeId', 'unitId']);
  });
});

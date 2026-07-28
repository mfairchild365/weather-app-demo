import {
  getForecastHourly,
  getForecastDaily,
  type ForecastHourlyRow,
  type ForecastDailyRow,
} from '../lib/api-client';
import { useAsync, type AsyncResult } from './useAsync';

export interface UseForecastResult {
  hourly: AsyncResult<ForecastHourlyRow[]>;
  daily: AsyncResult<ForecastDailyRow[]>;
}

/**
 * Fetches both the hourly and daily forecast for a city eagerly (not on tab switch) — the Tabs
 * component (spec `keyboard`) only ever toggles which already-loaded panel is visible, so
 * switching tabs never triggers a new network request or a loading flash.
 */
export function useForecast(slug: string, reloadKey = 0): UseForecastResult {
  const hourly = useAsync(async () => (await getForecastHourly(slug)).rows, [slug, reloadKey]);
  const daily = useAsync(async () => (await getForecastDaily(slug)).rows, [slug, reloadKey]);
  return { hourly, daily };
}

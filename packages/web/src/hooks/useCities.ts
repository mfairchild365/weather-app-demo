import { getCities, type City } from '../lib/api-client';
import { useAsync, type AsyncResult } from './useAsync';

export function useCities(reloadKey = 0): AsyncResult<City[]> {
  return useAsync(getCities, [reloadKey]);
}

import { getCityDetail, type CityDetail } from '../lib/api-client';
import { useAsync, type AsyncResult } from './useAsync';

export function useCityDetail(slug: string, reloadKey = 0): AsyncResult<CityDetail> {
  return useAsync(() => getCityDetail(slug), [slug, reloadKey]);
}

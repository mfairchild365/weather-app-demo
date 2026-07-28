import { useEffect, useState, type DependencyList } from 'react';
import { ApiError } from '../lib/api-client';

export type AsyncResult<T> =
  { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: ApiError };

/**
 * Runs `fetcher` whenever `deps` changes, tracking loading/success/error. Shared by every
 * `use*` data hook so each of them stays a thin, single-purpose wrapper around one API call.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: DependencyList): AsyncResult<T> {
  const [result, setResult] = useState<AsyncResult<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setResult({ status: 'loading' });

    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult({
          status: 'error',
          error: error instanceof ApiError ? error : new ApiError('Unknown error'),
        });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is the caller's own dep array
  }, deps);

  return result;
}

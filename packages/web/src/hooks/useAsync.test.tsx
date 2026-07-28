import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '../lib/api-client';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  it('starts loading, then resolves to success with the fetched data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve({ n: 1 }), []));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({ status: 'success', data: { n: 1 } });
  });

  it('resolves to error with the ApiError on rejection', async () => {
    const error = new ApiError('boom', 500);
    const { result } = renderHook(() => useAsync(() => Promise.reject(error), []));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({ status: 'error', error });
  });

  it('re-fetches when deps change', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(({ key }) => useAsync(fetcher, [key]), {
      initialProps: { key: 1 },
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    rerender({ key: 2 });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});

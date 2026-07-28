import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCities } from './useCities';

describe('useCities', () => {
  it('fetches /api/cities and reflects success', async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => [{ slug: 'tokyo-jp' }],
      }) as Response) as typeof fetch;

    const { result } = renderHook(() => useCities());
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current).toMatchObject({ data: [{ slug: 'tokyo-jp' }] });
  });
});

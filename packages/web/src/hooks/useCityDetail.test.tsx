import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCityDetail } from './useCityDetail';

describe('useCityDetail', () => {
  it('fetches /api/cities/:slug and reflects an error status for a 404', async () => {
    globalThis.fetch = (async () =>
      ({ ok: false, status: 404, json: async () => ({}) }) as Response) as typeof fetch;

    const { result } = renderHook(() => useCityDetail('nonexistent'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({ error: { status: 404 } });
  });

  it('re-fetches when the slug changes', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return { ok: true, status: 200, json: async () => ({ slug: `city-${calls}` }) } as Response;
    }) as typeof fetch;

    const { result, rerender } = renderHook(({ slug }) => useCityDetail(slug), {
      initialProps: { slug: 'a' },
    });
    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ slug: 'b' });
    await waitFor(() => expect(calls).toBe(2));
  });
});

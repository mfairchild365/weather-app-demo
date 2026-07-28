import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCities, getCityDetail, ApiError } from './api-client';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api-client', () => {
  it('getCities calls the relative /api/cities path and returns parsed JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([{ slug: 'tokyo-jp' }]));
    vi.stubGlobal('fetch', fetchMock);

    const cities = await getCities();

    expect(fetchMock).toHaveBeenCalledWith('/api/cities');
    expect(cities).toEqual([{ slug: 'tokyo-jp' }]);
  });

  it('throws ApiError with the response status on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, { ok: false, status: 404 })),
    );

    await expect(getCityDetail('nonexistent')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('throws ApiError (no status) on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    const error = await getCities().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBeUndefined();
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import fixture from './__fixtures__/open-meteo-response.json' with { type: 'json' };
import { fetchForecast, OpenMeteoFetchError } from './open-meteo-client';

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: 'OK',
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchForecast', () => {
  it('fetches and validates a well-formed response, requesting UTC timestamps', async () => {
    const fetchMock = vi.fn(async (_url: string) => jsonResponse(fixture));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchForecast({ latitude: '45.5', longitude: '-122.6' });

    expect(result.current.temperature_2m).toBe(24.3);
    expect(result.hourly.time).toHaveLength(4);
    expect(result.daily.time).toHaveLength(3);

    const [firstCall] = fetchMock.mock.calls;
    if (!firstCall) throw new Error('fetch was not called');
    const requestedUrl = new URL(firstCall[0]);
    expect(requestedUrl.searchParams.get('timezone')).toBe('UTC');
    expect(requestedUrl.searchParams.get('latitude')).toBe('45.5');
  });

  it('throws on a non-2xx response instead of returning partial data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, { ok: false, status: 500 })),
    );

    await expect(fetchForecast({ latitude: '0', longitude: '0' })).rejects.toBeInstanceOf(
      OpenMeteoFetchError,
    );
  });

  it('throws when the response body does not match the expected shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ latitude: 1, longitude: 2 })),
    );

    await expect(fetchForecast({ latitude: '0', longitude: '0' })).rejects.toBeInstanceOf(
      OpenMeteoFetchError,
    );
  });

  it('throws when the network request itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    await expect(fetchForecast({ latitude: '0', longitude: '0' })).rejects.toBeInstanceOf(
      OpenMeteoFetchError,
    );
  });
});

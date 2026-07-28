import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useForecast } from './useForecast';

describe('useForecast', () => {
  it('fetches both hourly and daily ranges eagerly, independent of tab selection', async () => {
    const requested: string[] = [];
    globalThis.fetch = (async (input: string) => {
      requested.push(new URL(input, 'http://localhost').searchParams.get('range') ?? '');
      const range = requested.at(-1);
      return {
        ok: true,
        status: 200,
        json: async () => ({ range, rows: [{ range }] }),
      } as Response;
    }) as typeof fetch;

    const { result } = renderHook(() => useForecast('tokyo-jp'));
    await waitFor(() => {
      expect(result.current.hourly.status).toBe('success');
      expect(result.current.daily.status).toBe('success');
    });

    expect(requested.sort()).toEqual(['daily', 'hourly']);
  });
});

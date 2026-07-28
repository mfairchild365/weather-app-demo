import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startScheduler } from './scheduler';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('startScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the cycle immediately on start, without waiting for the first tick', async () => {
    const cycle = vi.fn(async () => {});
    const scheduler = startScheduler(cycle, { intervalMs: 1000 });

    await vi.advanceTimersByTimeAsync(0);

    expect(cycle).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it('runs again after each interval once the previous cycle has finished', async () => {
    const cycle = vi.fn(async () => {});
    const scheduler = startScheduler(cycle, { intervalMs: 1000 });

    await vi.advanceTimersByTimeAsync(0);
    expect(cycle).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(cycle).toHaveBeenCalledTimes(2);

    scheduler.stop();
  });

  it('does not start a new cycle while one is still in progress (spec FR-006)', async () => {
    const first = deferred<void>();
    let callCount = 0;
    const cycle = vi.fn(() => {
      callCount += 1;
      return callCount === 1 ? first.promise : Promise.resolve();
    });

    const scheduler = startScheduler(cycle, { intervalMs: 1000 });

    await vi.advanceTimersByTimeAsync(0);
    expect(cycle).toHaveBeenCalledTimes(1);

    // A tick fires while the first cycle is still pending — it must be skipped, not queued.
    await vi.advanceTimersByTimeAsync(1000);
    expect(cycle).toHaveBeenCalledTimes(1);

    first.resolve();
    await vi.advanceTimersByTimeAsync(0);

    // Now that the first cycle has finished, the next tick is allowed to start a new one.
    await vi.advanceTimersByTimeAsync(1000);
    expect(cycle).toHaveBeenCalledTimes(2);

    scheduler.stop();
  });

  it('stop() prevents any further ticks', async () => {
    const cycle = vi.fn(async () => {});
    const scheduler = startScheduler(cycle, { intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(cycle).toHaveBeenCalledTimes(1);

    scheduler.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(cycle).toHaveBeenCalledTimes(1);
  });
});

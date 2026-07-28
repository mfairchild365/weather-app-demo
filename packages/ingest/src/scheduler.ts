export interface Scheduler {
  stop: () => void;
}

export interface SchedulerOptions {
  intervalMs?: number;
}

/** Hourly, per spec FR-002. */
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Runs `cycle` immediately on start (spec FR-002 — a fresh `docker compose up` has data without
 * waiting for the first tick), then every `intervalMs` (default hourly). Guards against
 * overlapping runs (spec FR-006 / edge case "cycles would overlap"): if a cycle is still in
 * flight when the next tick fires, that tick is skipped rather than starting a concurrent cycle.
 */
export function startScheduler(
  cycle: () => Promise<void>,
  options: SchedulerOptions = {},
): Scheduler {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  let running = false;

  const tick = async (): Promise<void> => {
    if (running) {
      console.warn('Skipping ingestion tick: the previous cycle is still in progress.');
      return;
    }
    running = true;
    try {
      await cycle();
    } catch (error) {
      console.error('Ingestion cycle failed unexpectedly:', error);
    } finally {
      running = false;
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return {
    stop: () => clearInterval(timer),
  };
}

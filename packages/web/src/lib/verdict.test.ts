import { describe, it, expect } from 'vitest';
import { getVerdict } from './verdict';

const KNOWN_ICON_KEYS = [
  'clear',
  'mostly-clear',
  'partly-cloudy',
  'overcast',
  'fog',
  'drizzle',
  'freezing-drizzle',
  'rain',
  'freezing-rain',
  'rain-showers',
  'snow',
  'snow-showers',
  'thunderstorm',
  'thunderstorm-hail',
];

describe('getVerdict', () => {
  it('is deterministic — identical inputs always produce the identical output (SC-006)', () => {
    const input = { temperature: 4.2, iconKey: 'rain', isDay: true };
    const first = getVerdict(input);
    const second = getVerdict({ ...input });
    expect(first).toBe(second);
    expect(first).toBe(getVerdict(input));
  });

  it.each(KNOWN_ICON_KEYS)('produces a non-empty line for iconKey "%s" without throwing', (key) => {
    expect(() => getVerdict({ temperature: 12, iconKey: key, isDay: true })).not.toThrow();
    expect(getVerdict({ temperature: 12, iconKey: key, isDay: true }).length).toBeGreaterThan(0);
  });

  it('never throws for an unrecognized iconKey', () => {
    expect(() =>
      getVerdict({ temperature: 12, iconKey: 'ball-lightning', isDay: true }),
    ).not.toThrow();
  });

  it('includes the rounded temperature in the line', () => {
    expect(getVerdict({ temperature: 3.6, iconKey: 'clear', isDay: true })).toContain('4°C');
    expect(getVerdict({ temperature: 3.4, iconKey: 'clear', isDay: true })).toContain('3°C');
  });

  it('varies clear-sky phrasing by day/night', () => {
    const day = getVerdict({ temperature: 15, iconKey: 'clear', isDay: true });
    const night = getVerdict({ temperature: 15, iconKey: 'clear', isDay: false });
    expect(day).not.toBe(night);
  });
});

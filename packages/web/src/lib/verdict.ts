export interface VerdictInput {
  temperature: number;
  iconKey: string;
  isDay: boolean;
}

type ConditionFamily = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm' | 'unknown';

const FAMILY_BY_ICON_KEY: Record<string, ConditionFamily> = {
  clear: 'clear',
  'mostly-clear': 'clear',
  'partly-cloudy': 'cloudy',
  overcast: 'cloudy',
  fog: 'fog',
  drizzle: 'rain',
  'freezing-drizzle': 'rain',
  rain: 'rain',
  'freezing-rain': 'rain',
  'rain-showers': 'rain',
  snow: 'snow',
  'snow-showers': 'snow',
  thunderstorm: 'storm',
  'thunderstorm-hail': 'storm',
};

function conditionPhrase(family: ConditionFamily, isDay: boolean): string {
  switch (family) {
    case 'clear':
      return isDay ? 'Clear skies.' : "Clear skies, for what that's worth in the dark.";
    case 'cloudy':
      return 'Cloudy. Admittedly unremarkable.';
    case 'fog':
      return "Fog. Can't see much else.";
    case 'rain':
      return 'Raining. You knew this already.';
    case 'snow':
      return 'Snowing. Bundle up, or don’t.';
    case 'storm':
      return 'Thunderstorms. Loud, allegedly.';
    default:
      return 'Conditions unclear, which feels appropriate.';
  }
}

function temperatureAside(roundedTemp: number): string {
  if (roundedTemp < 0) return ' Layer up.';
  if (roundedTemp >= 32) return ' Stay hydrated.';
  return '';
}

/**
 * Pure, deterministic one-line commentary on current conditions ("the verdict" — spec 004 FR-009):
 * identical (temperature, iconKey, isDay) always produces the identical string, banded on
 * temperature and condition family, never randomized. Rendered as ordinary static content, never
 * a live region (see spec 004 Acceptance Scenario US3.2) — it never carries data unavailable
 * elsewhere; the temperature and weatherLabel text sit directly above it.
 */
export function getVerdict({ temperature, iconKey, isDay }: VerdictInput): string {
  const rounded = Math.round(temperature);
  const family = FAMILY_BY_ICON_KEY[iconKey] ?? 'unknown';
  return `${rounded}°C. ${conditionPhrase(family, isDay)}${temperatureAside(rounded)}`;
}

import type { ReactNode } from 'react';

export type WeatherIconKey =
  | 'clear'
  | 'mostly-clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'freezing-drizzle'
  | 'rain'
  | 'freezing-rain'
  | 'rain-showers'
  | 'snow'
  | 'snow-showers'
  | 'thunderstorm'
  | 'thunderstorm-hail';

export interface WeatherIconProps {
  /** The API's `weatherIconKey` — an unrecognized value renders the neutral fallback, never a
   * broken or missing image (spec 004 FR-004). */
  iconKey: string;
  className?: string;
}

const SUN = (
  <>
    <circle cx="12" cy="9" r="3.2" />
    <path d="M12 3v1.4M12 12.6V14M6 9H4.6M19.4 9H18M7.5 4.5l1 1M16.5 4.5l-1 1" />
  </>
);

const CLOUD_SMALL = (
  <path d="M8 17a3.2 3.2 0 0 1-.4-6.38A4 4 0 0 1 15.4 9.3 3.6 3.6 0 0 1 15 17Z" />
);

const CLOUD_BIG = (
  <path d="M6.5 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.53-2.03A4.5 4.5 0 0 1 18 17H6.5Z" />
);

const FOG_LINES = <path d="M5 19h14M6.5 21.5h11" />;

/** Small filled droplet mark — currentColor only, no hardcoded fill (references/contrast-forced-colors.md). */
function drop(x: number, y: number, key: string) {
  return (
    <path
      key={key}
      d={`M${x} ${y}l0.9 1.6a0.9 0.9 0 1 1-1.8 0Z`}
      fill="currentColor"
      stroke="none"
    />
  );
}

function flake(x: number, y: number, key: string) {
  return (
    <path
      key={key}
      d={`M${x} ${y - 1}v2M${x - 0.9} ${y - 0.5}l1.8 1M${x + 0.9} ${y - 0.5}l-1.8 1`}
      strokeWidth={1}
    />
  );
}

function hail(x: number, y: number, key: string) {
  return <circle key={key} cx={x} cy={y} r={0.55} fill="currentColor" stroke="none" />;
}

const BOLT = (
  <path d="M12.5 13.5h-2.2l1.7-4.2-4 5.7h2.3l-1.6 4Z" fill="currentColor" stroke="none" />
);

/** Body for each recognized `iconKey`; the fallback (a plain cloud with a "?" mark) covers any
 * value not in this table — a future seed-data code added ahead of this file's update. */
function bodyFor(iconKey: string): ReactNode {
  switch (iconKey as WeatherIconKey) {
    case 'clear':
      return SUN;
    case 'mostly-clear':
      return (
        <>
          <circle cx="15.5" cy="7.5" r="2.6" />
          {CLOUD_SMALL}
        </>
      );
    case 'partly-cloudy':
      return (
        <>
          <circle cx="16" cy="7" r="2.4" />
          {CLOUD_BIG}
        </>
      );
    case 'overcast':
      return CLOUD_BIG;
    case 'fog':
      return (
        <>
          {CLOUD_SMALL}
          {FOG_LINES}
        </>
      );
    case 'drizzle':
      return (
        <>
          {CLOUD_BIG}
          {drop(9.5, 19, 'd1')}
          {drop(13.5, 19.5, 'd2')}
        </>
      );
    case 'freezing-drizzle':
      return (
        <>
          {CLOUD_BIG}
          {drop(9.5, 19, 'd1')}
          {flake(14, 19.5, 'f1')}
        </>
      );
    case 'rain':
      return (
        <>
          {CLOUD_BIG}
          {drop(8.5, 18.5, 'd1')}
          {drop(11.5, 20, 'd2')}
          {drop(14.5, 18.5, 'd3')}
        </>
      );
    case 'freezing-rain':
      return (
        <>
          {CLOUD_BIG}
          {drop(8.5, 18.5, 'd1')}
          {flake(12, 20, 'f1')}
          {drop(14.5, 18.5, 'd2')}
        </>
      );
    case 'rain-showers':
      return (
        <>
          {CLOUD_SMALL}
          <path d="M7.5 19l-1 2M15 19l-1 2" />
          {drop(11, 20, 'd1')}
        </>
      );
    case 'snow':
      return (
        <>
          {CLOUD_BIG}
          {flake(9, 19.5, 'f1')}
          {flake(12, 20.5, 'f2')}
          {flake(15, 19.5, 'f3')}
        </>
      );
    case 'snow-showers':
      return (
        <>
          {CLOUD_SMALL}
          {flake(9, 19.5, 'f1')}
          {flake(13, 19.5, 'f2')}
        </>
      );
    case 'thunderstorm':
      return (
        <>
          {CLOUD_BIG}
          {BOLT}
        </>
      );
    case 'thunderstorm-hail':
      return (
        <>
          {CLOUD_BIG}
          {BOLT}
          {hail(8.5, 20, 'h1')}
          {hail(15.5, 20, 'h2')}
        </>
      );
    default:
      // Fallback: a plain cloud, no bolts/drops/flakes implied — honest about not knowing.
      return (
        <>
          {CLOUD_BIG}
          <path d="M12 13v2M12 16.5v0.1" />
        </>
      );
  }
}

/**
 * Decorative weather glyph rendered beside the always-present accessible `weatherLabel` text
 * (current conditions and every forecast table row) — never the sole source of the condition
 * (spec 004 FR-004/FR-005). `aria-hidden="true"`, single-color line art via `currentColor` only
 * (ladder tier 5, justified: icon + text pair, see references/images-graphics.md).
 */
export function WeatherIcon({ iconKey, className = '' }: WeatherIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {bodyFor(iconKey)}
    </svg>
  );
}

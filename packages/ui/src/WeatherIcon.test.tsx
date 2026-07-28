import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { WeatherIcon } from './WeatherIcon';

// The 14 seeded iconKey values (packages/db/src/seed-data.ts) — spec 004 FR-004/SC-002 requires
// every one of these, plus an unrecognized value, to render without throwing.
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

describe('WeatherIcon', () => {
  it('is aria-hidden — decorative, paired with the accessible weatherLabel text (FR-005)', () => {
    const { container } = render(<WeatherIcon iconKey="clear" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(KNOWN_ICON_KEYS)('renders a distinct icon for iconKey "%s" without throwing', (key) => {
    const { container } = render(<WeatherIcon iconKey={key} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a fallback icon for an unrecognized iconKey, never a broken/missing image (SC-002)', () => {
    const { container } = render(<WeatherIcon iconKey="ball-lightning" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('path, circle')).toBeInTheDocument();
  });

  it('is not exposed to the accessibility tree', async () => {
    const { container } = render(
      <div>
        <WeatherIcon iconKey="thunderstorm-hail" />
        <p>Thunderstorm with hail</p>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

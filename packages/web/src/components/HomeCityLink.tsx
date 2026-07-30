import { Link, useLocation } from 'react-router-dom';
import { useVisitorContext } from '../context/visitor-context';

/** Header link to the visitor's pinned home city (spec 006 FR-006). Renders nothing when no city
 * is pinned. The visible text is the accessible name — the star is decorative and aria-hidden —
 * so no aria-label is needed. Underlined, not color alone, matching App.tsx's footer link. */
export function HomeCityLink() {
  const { homeCity } = useVisitorContext();
  const location = useLocation();

  if (!homeCity) return null;

  const path = `/cities/${homeCity.slug}`;
  const isCurrent = location.pathname === path;

  return (
    <Link
      to={path}
      {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
      className="inline-flex items-center gap-1 text-sm text-[var(--color-link)] underline underline-offset-2"
    >
      <span aria-hidden="true">★</span>
      Home: {homeCity.name}, {homeCity.regionName}
    </Link>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchField, StatusMessage, Button } from '@weather-demo/ui';
import { useCities } from '../hooks/useCities';
import { useVisitorContext } from '../context/visitor-context';
import { copy } from '../copy';

/** spec status_messages: #city-list-status (polite) / #city-list-error (alert). spec 006: the
 * pinned home city, when set, sorts first within the filtered results. */
export function CityListPage() {
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const result = useCities(reloadKey);
  const { homeCity, reconcileHomeCity } = useVisitorContext();

  const filtered = useMemo(() => {
    if (result.status !== 'success') return [];
    const q = query.trim().toLowerCase();
    if (!q) return result.data;
    return result.data.filter(
      (city) => city.name.toLowerCase().includes(q) || city.region.name.toLowerCase().includes(q),
    );
  }, [result, query]);

  // A separate memo from `filtered` on purpose: reordering must not retrigger the debounced
  // count effect below (which depends on `filtered`), and the pinned city is only ever hoisted
  // from *within* the filtered set — never re-added when the search query excludes it (spec 006
  // FR-007: the filter takes precedence over the pin).
  const ordered = useMemo(() => {
    if (!homeCity) return filtered;
    const index = filtered.findIndex((city) => city.slug === homeCity.slug);
    if (index <= 0) return filtered; // covers both "not present" and "already first"
    const pinned = filtered[index];
    if (!pinned) return filtered; // noUncheckedIndexedAccess
    return [pinned, ...filtered.slice(0, index), ...filtered.slice(index + 1)];
  }, [filtered, homeCity]);

  // Heal a stale cached display name once fresh city-list data arrives (spec 006 FR-010).
  // Silent — the visitor didn't act. reconcileHomeCity() no-ops internally when nothing changed.
  useEffect(() => {
    if (result.status !== 'success' || !homeCity) return;
    const fresh = result.data.find((city) => city.slug === homeCity.slug);
    if (!fresh) return; // absent from this list entirely; only a 404 on the detail page clears it
    reconcileHomeCity({ slug: fresh.slug, name: fresh.name, regionName: fresh.region.name });
  }, [result, homeCity, reconcileHomeCity]);

  const [countMessage, setCountMessage] = useState('');

  useEffect(() => {
    document.title = copy.tabTitle;
  }, []);

  useEffect(() => {
    if (result.status !== 'success') {
      setCountMessage('');
      return;
    }
    // Debounced so rapid typing announces once, not on every keystroke — status-messages.md's
    // "chatty regions" pitfall.
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      const easterEgg = copy.EASTER_EGGS[trimmed.toLowerCase()];
      if (easterEgg) {
        setCountMessage(easterEgg);
      } else if (trimmed && filtered.length === 0) {
        setCountMessage(copy.noMatches(trimmed));
      } else {
        setCountMessage(copy.cityCount(filtered.length, trimmed));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [result.status, filtered, query]);

  const loadingMessage = result.status === 'loading' ? copy.loading : '';
  const errorMessage = result.status === 'error' ? copy.citiesError : '';

  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-bold">{copy.listHeading}</h1>

      <SearchField
        label="Search cities"
        placeholder="City or region"
        value={query}
        onChange={setQuery}
        className="mb-2 max-w-sm"
      />

      <StatusMessage
        id="city-list-status"
        politeness="status"
        message={loadingMessage || countMessage}
        className="mb-4 text-sm text-[var(--color-muted-text)]"
      />
      <StatusMessage
        id="city-list-error"
        politeness="alert"
        message={errorMessage}
        className="mb-2 font-medium text-[var(--color-danger)]"
      />

      {result.status === 'error' && (
        <Button onPress={() => setReloadKey((key) => key + 1)}>Retry loading cities</Button>
      )}

      {result.status === 'success' && (
        <ul className="flex flex-col gap-2">
          {ordered.map((city) => (
            <li key={city.slug}>
              <Link
                to={`/cities/${city.slug}`}
                className="text-[var(--color-link)] underline-offset-2 hover:underline"
              >
                {city.name}, {city.region.name}
                {/* Marked in text, not by position alone (WCAG 1.3.3) — the suffix is inside the
                    link, so it's part of the accessible name, not an adjacent orphan. */}
                {homeCity?.slug === city.slug && (
                  <span className="text-[var(--color-muted-text)]"> (home city)</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

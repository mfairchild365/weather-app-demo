import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchField, StatusMessage, Button } from '@weather-demo/ui';
import { useCities } from '../hooks/useCities';
import { copy } from '../copy';

/** spec status_messages: #city-list-status (polite) / #city-list-error (alert). */
export function CityListPage() {
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const result = useCities(reloadKey);

  const filtered = useMemo(() => {
    if (result.status !== 'success') return [];
    const q = query.trim().toLowerCase();
    if (!q) return result.data;
    return result.data.filter(
      (city) => city.name.toLowerCase().includes(q) || city.region.name.toLowerCase().includes(q),
    );
  }, [result, query]);

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
          {filtered.map((city) => (
            <li key={city.slug}>
              <Link
                to={`/cities/${city.slug}`}
                className="text-[var(--color-link)] underline-offset-2 hover:underline"
              >
                {city.name}, {city.region.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

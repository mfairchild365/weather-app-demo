import { useRef } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { SkipLink } from '@weather-demo/ui';
import { useFocusMainOnRouteChange } from './hooks/useFocusMainOnRouteChange';
import { CityListPage } from './routes/CityListPage';
import { CityDetailPage } from './routes/CityDetailPage';
import { NotFoundPage } from './routes/NotFoundPage';

const MAIN_ID = 'maincontent';

export function App() {
  const mainRef = useRef<HTMLElement | null>(null);
  useFocusMainOnRouteChange(mainRef);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <SkipLink targetId={MAIN_ID} />
      <header className="border-b border-[var(--color-border)] px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-[var(--color-text)] no-underline">
          weather-demo
        </Link>
      </header>

      <main
        id={MAIN_ID}
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 outline-none"
      >
        <Routes>
          <Route path="/" element={<CityListPage />} />
          <Route path="/cities/:slug" element={<CityDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="border-t border-[var(--color-border)] px-4 py-4 text-sm text-[var(--color-muted-text)]">
        Weather data by{' '}
        {/* Underlined, not color alone, to distinguish this link from the surrounding text
            (references/contrast-forced-colors.md: "never rely on color alone"). */}
        <a href="https://open-meteo.com/" className="text-[var(--color-link)] underline">
          Open-Meteo
        </a>
        , licensed CC BY 4.0.
      </footer>
    </div>
  );
}

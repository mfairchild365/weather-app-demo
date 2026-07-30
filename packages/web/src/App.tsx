import { useRef } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { SkipLink, Mascot } from '@weather-demo/ui';
import { useFocusMainOnRouteChange } from './hooks/useFocusMainOnRouteChange';
import { copy } from './copy';
import { CityListPage } from './routes/CityListPage';
import { CityDetailPage } from './routes/CityDetailPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { HomeCityLink } from './components/HomeCityLink';
import { ForgetPreferencesButton } from './components/ForgetPreferencesButton';

const MAIN_ID = 'maincontent';

export function App() {
  const mainRef = useRef<HTMLElement | null>(null);
  useFocusMainOnRouteChange(mainRef);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <SkipLink targetId={MAIN_ID} />
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--color-border)] px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-text)] no-underline"
        >
          <Mascot className="h-6 w-6" />
          {copy.brand}
        </Link>
        {/* min-h above reserves the header's populated height so this link appearing/disappearing
            never reflows <main> under a control that currently has focus (spec 006 `dynamic_state`).
            flex-wrap (here and on the header itself) lets this group drop to its own row at
            narrow viewports instead of forcing horizontal scroll (references/reflow.md: "controls
            rearrange vertically" rather than being clipped or truncated). */}
        <div className="flex flex-wrap items-center gap-4">
          <HomeCityLink />
          <ForgetPreferencesButton />
        </div>
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
        {copy.footerPrefix}
        {/* Underlined, not color alone, to distinguish this link from the surrounding text
            (references/contrast-forced-colors.md: "never rely on color alone"). */}
        <a href="https://open-meteo.com/" className="text-[var(--color-link)] underline">
          Open-Meteo
        </a>
        {copy.footerSuffix}
        {copy.footerRepoPrefix}
        <a
          href="https://github.com/mfairchild365/weather-app-demo"
          className="text-[var(--color-link)] underline"
        >
          GitHub
        </a>
        {copy.footerRepoSuffix}
      </footer>
    </div>
  );
}

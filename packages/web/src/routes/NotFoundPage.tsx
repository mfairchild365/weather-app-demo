import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/** Catch-all route for any URL that doesn't match a known page. */
export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — weather-demo';
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Page not found</h1>
      <p className="mb-4 text-[var(--color-muted-text)]">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/" className="text-[var(--color-link)] underline-offset-2 hover:underline">
        Back to city list
      </Link>
    </div>
  );
}

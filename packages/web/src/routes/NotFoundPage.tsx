import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { copy } from '../copy';

/** Catch-all route for any URL that doesn't match a known page. */
export function NotFoundPage() {
  useEffect(() => {
    document.title = copy.notFoundTitle;
  }, []);

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">{copy.pageNotFoundHeading}</h1>
      <p className="mb-4 text-[var(--color-muted-text)]">{copy.pageNotFoundBody}</p>
      <Link to="/" className="text-[var(--color-link)] underline-offset-2 hover:underline">
        Back to city list
      </Link>
    </div>
  );
}

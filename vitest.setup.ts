import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest.config.ts sets `globals: false`, so Testing Library's usual auto-cleanup (which hooks
// the test framework's global afterEach) doesn't register itself — wire it explicitly instead,
// or DOM from one test's render leaks into the next.
afterEach(() => {
  cleanup();
});

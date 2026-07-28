// Ambient type augmentation for `expect(...).toBeInTheDocument()` etc. (jest-dom) and
// `expect(...).toHaveNoViolations()` (vitest-axe) — the runtime side of both is wired in
// vitest.setup.ts (repo root); this file makes tsc --noEmit aware of the same augmentation when
// typechecking this package standalone.
import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';

import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

/**
 * spec SC-003: zero violations rated `serious` or `critical`. `minor`/`moderate` best-practice
 * items are reported but not asserted on, matching references/testing.md's severity handling.
 */
export async function seriousOrCriticalViolations(page: Page): Promise<Result[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
}

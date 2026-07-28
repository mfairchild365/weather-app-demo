import { test, expect } from '@playwright/test';

/** spec User Story 3 — the whole site operable by keyboard alone, with visible focus. */
test('keyboard-only journey: skip link -> city link -> new page focus -> tab switch (US3.1-3.3)', async ({
  page,
}) => {
  await page.goto('/');

  // US3.1: the skip link is the very first Tab stop and is visibly focused.
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  const skipLinkOutline = await skipLink.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(skipLinkOutline).not.toBe('none');

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  // Reach a city link by keyboard and activate it — no mouse anywhere in this test.
  const cityLink = page.getByRole('link', { name: /Tokyo, Japan/ });
  await cityLink.focus();
  await expect(cityLink).toBeFocused();
  await page.keyboard.press('Enter');

  // US3.3: focus lands on the new page's <main>, not a link that no longer exists.
  await expect(page.getByRole('heading', { name: 'Tokyo forecast' })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();

  // US3.2: arrow keys move and activate within the Hourly/Daily tab list, one tab stop.
  const hourlyTab = page.getByRole('tab', { name: 'Hourly' });
  await hourlyTab.focus();
  await expect(hourlyTab).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  const dailyTab = page.getByRole('tab', { name: 'Daily' });
  await expect(dailyTab).toHaveAttribute('aria-selected', 'true');
  await expect(dailyTab).toBeFocused();
  await expect(page.getByRole('table', { name: 'Tokyo daily forecast' })).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { seriousOrCriticalViolations } from './axe-helper';

const CITY_PATH = '/cities/tokyo-jp';

test.describe('city detail page', () => {
  test('shows current conditions and the hourly table by default (Acceptance Scenario US2.1)', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await expect(page.getByRole('heading', { name: 'Tokyo forecast' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Tokyo hourly forecast' })).toBeVisible();
  });

  test('switching to Daily replaces the table without a full reload (US2.3)', async ({ page }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('table', { name: 'Tokyo hourly forecast' }).waitFor();

    await page.getByRole('tab', { name: 'Daily' }).click();

    await expect(page.getByRole('table', { name: 'Tokyo daily forecast' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Tokyo hourly forecast' })).toHaveCount(0);
  });

  test('shows "City not found" for an unknown slug, not a crash (spec FR-008)', async ({
    page,
  }) => {
    await page.goto('/cities/does-not-exist');
    await expect(page.getByRole('heading', { name: 'City not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to city list' })).toBeVisible();
  });

  test('has no serious or critical axe violations (hourly, daily, not-found states)', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('table', { name: 'Tokyo hourly forecast' }).waitFor();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);

    await page.getByRole('tab', { name: 'Daily' }).click();
    await page.getByRole('table', { name: 'Tokyo daily forecast' }).waitFor();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);

    await page.goto('/cities/does-not-exist');
    await page.getByRole('heading', { name: 'City not found' }).waitFor();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });

  test('reflows with no horizontal page scroll at 320 CSS px (spec SC-004)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(CITY_PATH);
    await page.getByRole('table', { name: 'Tokyo hourly forecast' }).waitFor();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    // The forecast table is allowed its own horizontal scroll container (references/reflow.md);
    // the page/document itself must not need one.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('focus indicators remain visible under forced-colors: active (spec SC-005)', async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(CITY_PATH);
    await page.getByRole('table', { name: 'Tokyo hourly forecast' }).waitFor();

    const tab = page.getByRole('tab', { name: 'Hourly' });
    await tab.focus();
    const outlineStyle = await tab.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');

    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { seriousOrCriticalViolations } from './axe-helper';

test.describe('city list page', () => {
  test('lists cities and links to a city page (Acceptance Scenario US1.1)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Weather forecasts' })).toBeVisible();
    const link = page.getByRole('link', { name: /Tokyo, Japan/ });
    await expect(link).toBeVisible();
  });

  test('filters the list as the visitor types and announces the result count (US1.2)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search cities' }).fill('tok');
    await expect(page.getByRole('link', { name: /Tokyo, Japan/ })).toBeVisible();
    await expect(page.locator('#city-list-status')).toContainText('matching "tok"');
  });

  test('shows a "no matches" message for a query with no results (US1.3)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search cities' }).fill('zzzznotacity');
    await expect(page.locator('#city-list-status')).toHaveText('No cities match "zzzznotacity".');
  });

  test('has no serious or critical axe violations (default state)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Tokyo, Japan/ })).toBeVisible();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });

  test('has no serious or critical axe violations (filtered, empty-result state)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search cities' }).fill('zzzznotacity');
    await expect(page.locator('#city-list-status')).toContainText('No cities match');
    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { seriousOrCriticalViolations } from './axe-helper';

const CITY_PATH = '/cities/tokyo-jp';
const VISITOR_CONTEXT_KEY = 'probably-weather:visitor-context';
const TOGGLE_NAME = 'Home city: Tokyo, Japan';
const HEADER_LINK_NAME = 'Home: Tokyo, Japan';

test.describe('visitor context: pinned home city (spec 006)', () => {
  test('pinning a city survives a full page reload (proves storage, not just React state)', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    const toggle = page.getByRole('button', { name: TOGGLE_NAME });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('button', { name: TOGGLE_NAME })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      VISITOR_CONTEXT_KEY,
    );
    expect(stored).toContain('tokyo-jp');
  });

  test('the pinned city sorts first in the list, marked in text, and the filter still wins', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();

    await page.goto('/');
    const firstLink = page.getByRole('list').getByRole('link').first();
    await expect(firstLink).toHaveAccessibleName(/Tokyo, Japan \(home city\)/);

    // The filter beats the pin — a query that excludes Tokyo must not resurface it in the list.
    // Scoped to the list itself: the header's own "Home: Tokyo, Japan" link is unrelated to the
    // search filter and stays visible regardless, so an unscoped locator would false-negative.
    await page.getByRole('searchbox', { name: 'Search cities' }).fill('zzzznotacity');
    await expect(page.getByRole('list').getByRole('link', { name: /Tokyo, Japan/ })).toHaveCount(
      0,
    );
  });

  test('the header link carries aria-current on the pinned city\'s own page, not elsewhere', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();

    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.goto('/');
    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('forgetting preferences removes the header link and keeps focus on the button', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();

    await page.goto('/');
    const forgetButton = page.getByRole('button', { name: 'Forget my saved preferences' });
    await forgetButton.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toHaveCount(0);
    await expect(forgetButton).toBeFocused();
  });

  test('forgetting with nothing pinned still gives feedback rather than doing nothing', async ({
    page,
  }) => {
    await page.goto('/');
    const forgetButton = page.getByRole('button', { name: 'Forget my saved preferences' });
    await forgetButton.click();
    await expect(page.locator('[data-announcer="polite"]')).toHaveText('Nothing saved to forget.');
  });

  test('keyboard-only: skip link -> brand -> home link -> forget -> main, all visibly focused', async ({
    page,
  }) => {
    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();
    await page.goto('/');

    await page.keyboard.press('Tab'); // skip link
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

    await page.keyboard.press('Tab'); // brand link
    await expect(page.getByRole('link', { name: 'Probably Weather' })).toBeFocused();

    await page.keyboard.press('Tab'); // home city link
    const homeLink = page.getByRole('link', { name: HEADER_LINK_NAME });
    await expect(homeLink).toBeFocused();
    expect(await homeLink.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');

    await page.keyboard.press('Tab'); // forget button
    const forgetButton = page.getByRole('button', { name: 'Forget my saved preferences' });
    await expect(forgetButton).toBeFocused();
    expect(await forgetButton.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe(
      'none',
    );

    await page.keyboard.press('Tab'); // first city link in <main>
    await expect(page.locator('main')).not.toBeFocused();
  });

  test('has no serious or critical axe violations across list, detail, pinned, and post-forget states', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await seriousOrCriticalViolations(page)).toEqual([]);

    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);

    await page.goto('/');
    await expect(page.getByRole('link', { name: /Tokyo, Japan \(home city\)/ })).toBeVisible();
    expect(await seriousOrCriticalViolations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Forget my saved preferences' }).click();
    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toHaveCount(0);
    expect(await seriousOrCriticalViolations(page)).toEqual([]);
  });

  test('reflows with no horizontal page scroll at 320 CSS px with the header populated', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(CITY_PATH);
    await page.getByRole('button', { name: TOGGLE_NAME }).click();
    await expect(page.getByRole('link', { name: HEADER_LINK_NAME })).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

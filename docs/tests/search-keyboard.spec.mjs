import { test, expect } from '@playwright/test';

test.describe('Site search dialog', () => {
  test('shows suggestions, supports arrow-key navigation, and Enter opens the first result', async ({ page }) => {
    await page.goto('/squad/');
    await page.keyboard.press('Control+k');
    await expect(page.locator('#search-modal')).toBeVisible();
    await expect(page.getByText('Suggested')).toBeVisible();

    await page.keyboard.type('skills');
    const results = page.locator('#search-results a.search-result');
    await expect(results.first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#search-empty')).toBeHidden();

    await page.keyboard.press('ArrowDown');
    await expect(results.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(results.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#search-input')).toBeFocused();

    await page.keyboard.press('Enter');
    await page.waitForURL(/\/squad\/(docs|blog)\//, { timeout: 10_000 });
    await expect(page.locator('#search-modal')).toBeHidden();
  });

  test('first Escape clears the query, second closes the dialog', async ({ page }) => {
    await page.goto('/squad/');
    await page.keyboard.press('Control+k');
    await page.keyboard.type('agent');
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-modal')).toBeVisible();
    await expect(page.locator('#search-input')).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-modal')).toBeHidden();
  });
});

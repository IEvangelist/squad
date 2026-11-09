import { test, expect } from '@playwright/test';

test.describe('Blog hub', () => {
  test('search and category filters narrow the post grid, and clearing restores it', async ({ page }) => {
    await page.goto('/squad/blog/');
    const cards = page.locator('#post-grid .post-card:visible');
    const total = await cards.count();
    expect(total).toBeGreaterThan(10);

    await page.locator('#post-search').fill('swe-bench');
    await expect(cards).toHaveCount(1);
    await expect(page.locator('#post-count')).toHaveText('1 post');

    await page.locator('#post-search').fill('');
    await page.getByLabel('Release', { exact: false }).first().check();
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(cards).toHaveCount(total);
  });

  test('sort toggles order and "/" focuses search', async ({ page }) => {
    await page.goto('/squad/blog/');
    const firstTitle = () => page.locator('#post-grid .post-card:visible .card-title').first().innerText();
    const newest = await firstTitle();
    await page.locator('#post-sort').selectOption('oldest');
    expect(await firstTitle()).not.toBe(newest);

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('/');
    await expect(page.locator('#post-search')).toBeFocused();
  });

  test('post page shows a single h1, breadcrumb back to the blog, and an active TOC entry', async ({ page }) => {
    await page.goto('/squad/blog/004-v020-release/');
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Squad Blog' })).toBeVisible();
    await expect(page.locator('.article-aside .toc [aria-current="true"]')).toHaveCount(1);
  });
});

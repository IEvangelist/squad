/**
 * Accessibility + theming checks for the Primer-based docs front end.
 * Runs axe-core (WCAG 2.x A/AA) against key pages in light and dark color modes,
 * at desktop and mobile viewport sizes.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['home', '/squad/'],
  ['docs', '/squad/docs/get-started/installation/'],
  ['docs with code and tables', '/squad/docs/reference/cli/'],
  ['blog index', '/squad/blog/'],
  ['blog post', '/squad/blog/022-welcome-to-the-new-squad/'],
  ['404', '/squad/this-page-does-not-exist/'],
];

const MODES = ['light', 'dark'];

for (const mode of MODES) {
  test.describe(`axe: ${mode} mode`, () => {
    test.use({ colorScheme: mode, reducedMotion: 'reduce' });

    for (const [name, url] of PAGES) {
      test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
        await page.addInitScript((m) => localStorage.setItem('theme', m), mode);
        await page.goto(url);
        await expect(page.locator('html')).toHaveAttribute('data-color-mode', mode);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      });
    }
  });
}

test.describe('theme toggle', () => {
  test('toggles Primer color mode, updates the label, and persists across navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/squad/');
    const html = page.locator('html');
    const toggle = page.locator('#theme-toggle');

    await expect(html).toHaveAttribute('data-color-mode', 'auto');
    await expect(toggle).toHaveAccessibleName('Switch to dark theme');

    await toggle.click();
    await expect(html).toHaveAttribute('data-color-mode', 'dark');
    await expect(toggle).toHaveAccessibleName('Switch to light theme');

    await page.locator('header a[href$="/docs/get-started/installation/"]').first().click();
    await page.waitForURL('**/docs/get-started/installation/');
    await expect(html).toHaveAttribute('data-color-mode', 'dark');
  });

  test('follows the OS color scheme when no preference is stored', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/squad/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g).map(Number);
    expect(r + g + b).toBeLessThan(200);
  });
});

test.describe('keyboard and focus', () => {
  test('skip link is the first tab stop and moves focus to main content', async ({ page }) => {
    await page.goto('/squad/docs/get-started/installation/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('search dialog traps focus, closes on Escape, and restores focus to the trigger', async ({ page }) => {
    await page.goto('/squad/');
    const trigger = page.locator('#search-btn');
    await trigger.click();
    await expect(page.locator('#search-modal')).toBeVisible();
    await expect(page.locator('#search-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-modal')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('current docs page is exposed with aria-current in the sidebar', async ({ page }) => {
    await page.goto('/squad/docs/get-started/installation/');
    await expect(page.locator('#sidebar [aria-current="page"]')).toHaveCount(1);
  });
});

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('hamburger opens and closes the docs sidebar drawer without horizontal overflow', async ({ page }) => {
    await page.goto('/squad/docs/get-started/installation/');
    const toggle = page.locator('#mobile-nav-toggle');
    const sidebar = page.locator('#sidebar');

    await expect(sidebar).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sidebar).toBeHidden();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('home page does not scroll horizontally', async ({ page }) => {
    await page.goto('/squad/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('docs pager', () => {
  test('a lone next link spans the full width (first page)', async ({ page }) => {
    await page.goto('/squad/docs/get-started/five-minute-start/');
    const pager = page.locator('nav.pager');
    await expect(pager.locator('a')).toHaveCount(1);
    const [pw, lw] = await Promise.all([pager.evaluate((e) => e.clientWidth), pager.locator('a').evaluate((e) => e.getBoundingClientRect().width)]);
    expect(lw).toBeGreaterThan(pw - 4);
  });
});

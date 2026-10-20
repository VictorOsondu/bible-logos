import { test, expect } from '@playwright/test';

test.describe('personal features', () => {
  test('bookmarks, history and continue reading', async ({ page }) => {
    await page.goto('/reader/psalms/23');
    await page.getByRole('button', { name: 'Verse 1: show study tools' }).click();
    await page.getByRole('button', { name: 'Bookmark' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    await page.goto('/bookmarks');
    await expect(page.getByRole('link', { name: /Psalms 23:1/ })).toBeVisible();
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.getByRole('link', { name: /Psalms 23/ })).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('Continue reading')).toBeVisible();
    await expect(page.getByRole('link', { name: /Continue reading\s*Psalms 23/ })).toBeVisible();
  });

  test('theme choice survives a reload', async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const light = await background();
    const toggle = isMobile ? page.locator('header').getByRole('button', { name: /^Switch to/ }) : page.getByRole('button', { name: /^Switch to/ }).first();
    await toggle.click();
    const dark = await background();
    expect(dark).not.toBe(light);
    await page.reload();
    expect(await background()).toBe(dark);
  });
});

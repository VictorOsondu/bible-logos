import { test, expect } from '@playwright/test';

test.describe('reader', () => {
  test('tapping a word opens its Strong\'s entry', async ({ page }) => {
    await page.goto('/reader/john/3');
    await page.locator('#v16').getByRole('button', { name: /^loved:/ }).click();
    const panel = page.getByRole('complementary', { name: "Strong's G25" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText('agapáō')).toBeVisible();
  });

  test('works by keyboard: word study and verse tools', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard test runs on desktop');
    await page.goto('/reader/john/3');
    const word = page.locator('#v16').getByRole('button', { name: /^loved:/ });
    await word.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary', { name: "Strong's G25" })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('complementary', { name: "Strong's G25" })).toHaveCount(0);

    await page.getByRole('button', { name: 'Verse 16: show study tools' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary', { name: 'John 3:16' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'John 3:16' }).getByText(/cross-references? found/)).toBeVisible();
  });

  test('previous and next chapter links cross into neighbouring books', async ({ page }) => {
    await page.goto('/reader/malachi/4');
    await page.getByRole('link', { name: /^Next/ }).last().click();
    await expect(page).toHaveURL(/\/reader\/matthew\/1$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Matthew\s*1/);
  });

  test('search finds phrases and tolerates stray operators', async ({ page }) => {
    await page.goto('/search?q=%22good%20shepherd%22');
    await expect(page.getByText(/^2 results? for/)).toBeVisible();
    await page.goto('/search?q=NEAR(%20%22');
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
  });
});

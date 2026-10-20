import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test('mobile menu sits beside the logo and opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const menu = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
    const logo = await page.locator('header').getByRole('link', { name: 'Bible Logos' }).boundingBox();
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(logo!.x);

    await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = page.getByRole('complementary', { name: 'Main navigation' });
    await expect(nav).toBeInViewport();
    await nav.getByRole('link', { name: 'Concordance' }).click();
    await expect(page).toHaveURL(/\/concordance/);
    await expect(nav).not.toBeInViewport();
  });

  test('search palette jumps to a verse', async ({ page, isMobile }) => {
    await page.goto('/concordance');
    if (isMobile) await page.locator('header').getByRole('button', { name: 'Search' }).click();
    else await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/^Go to/).fill('John 3:16');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/reader\/john\/3#v16$/);
    await expect(page.locator('#v16')).toBeInViewport();
  });

  test('unknown pages and passages return 404', async ({ request }) => {
    for (const path of ['/reader/john/999', '/reader/no-such-book/1', '/word/X1', '/no-such-page']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
    expect((await request.get('/word/H2617')).status()).toBe(200);
  });

  test('responses carry security headers', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('health check reports ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

import { test, expect } from '@playwright/test';

test('optional works have introductions, full chapter coverage and credits', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByRole('heading', { name: 'Explore writings' })).toBeVisible();
  await page.getByRole('link', { name: 'Didache', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Didache 1');
  await expect(page.getByText(/Two ways there are/)).toBeVisible();
  await expect(page.getByLabel('Chapter in DID-HB').locator('option')).toHaveCount(16);
  await expect(page.getByRole('link', { name: 'Edition and source' })).toHaveAttribute('href', 'https://www.gutenberg.org/ebooks/42053');
  await expect(page.getByRole('button', { name: /show study tools/ })).toHaveCount(0);
  await page.getByLabel('Chapter in DID-HB').selectOption('16');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Didache 16');
  await page.goto('/reader/1-enoch/108?translations=ENO-CHARLES');
  await expect(page.getByLabel('Chapter in ENO-CHARLES').locator('option')).toHaveCount(108);
  await expect(page.getByText(/Another book which Enoch wrote/)).toBeVisible();
  await expect(page.getByText(/Printed in Great Britain/)).toHaveCount(0);
});

test('collections are opt-in and persist in the book browser', async ({ page }) => {
  await page.goto('/reader');
  await expect(page.getByRole('button', { name: 'Other writings', exact: true })).toHaveCount(0);
  await page.goto('/library');
  await page.getByRole('button', { name: 'Enable collection: Early Christian writings', exact: true }).click();
  await page.goto('/reader');
  await page.getByRole('button', { name: 'Other writings', exact: true }).click();
  await page.getByRole('button', { name: 'Didache', exact: true }).click();
  await page.getByRole('region', { name: 'Chapters of Didache' }).getByRole('link', { name: '1', exact: true }).click();
  await expect(page).toHaveURL(/didache\/1\?translations=DID-HB/);
});

test('Hebrew text has its own direction and saved edition', async ({ page }) => {
  await page.goto('/reader/john/3?translations=HEB-SG');
  const edition = page.getByRole('region', { name: 'Hebrew New Testament — Salkinson–Ginsburg' });
  await expect(edition.locator('[lang="he"][dir="rtl"]')).toBeVisible();
  await expect(edition.locator('#v16')).toContainText('אֱלֹהִים');
  await edition.getByRole('button', { name: 'Bookmark John 3:16', exact: true }).click();
  await page.goto('/bookmarks');
  const saved = page.getByRole('link', { name: /John 3.*HEB-SG/ });
  await expect(saved).toHaveAttribute('href', '/reader/john/3?translations=HEB-SG#v16');
  await saved.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('John 3');
});

test('Greek edition keeps native chapters and does not imply verse alignment', async ({ page }) => {
  await page.goto('/reader/psalms/106?translations=KJV,LXX-SWETE');
  await expect(page.getByText(/Matching chapter and verse numbers do not establish correspondence/)).toBeVisible();
  await expect(page.locator('[lang="grc"]')).toBeVisible();
  await page.getByLabel('Chapter in LXX-SWETE').selectOption('107');
  await expect(page.getByLabel('Chapter in KJV')).toHaveValue('106');
  await expect(page.getByLabel('Chapter in LXX-SWETE')).toHaveValue('107');
  await expect(page).toHaveURL(/translations=KJV(?:%2C|,)LXX-SWETE/);
  await page.goto('/reader/esther-(greek)/0?translations=LXX-SWETE');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('prologue');
  await expect(page.getByLabel('Chapter in LXX-SWETE')).toHaveValue('0');
});

test('unavailable passages retain the requested edition', async ({ page }) => {
  await page.goto('/reader/genesis/1?translations=HEB-SG');
  await expect(page.getByText(/This passage is unavailable in one or more selected versions/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Hebrew New Testament — Salkinson–Ginsburg/ })).toBeVisible();
  await expect(page.locator('.strongs-word')).toHaveCount(0);
});

test('search respects scope and opens the source edition', async ({ page }) => {
  await page.goto('/search?q=ways&scope=all&translation=DID-HB');
  const result = page.getByRole('link', { name: /Didache 1\s+DID-HB/ });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/didache\/1\?translations=DID-HB#v1/);
  await page.goto('/search?q=ways&scope=bible&translation=DID-HB');
  await expect(page.getByText(/^0 results/)).toBeVisible();
  await page.goto('/search?q=ways&scope=enabled&collections=early-christian&translation=DID-HB');
  await expect(page.getByRole('link', { name: /Didache 1\s+DID-HB/ })).toBeVisible();
  await page.goto('/search?q=אלהים&scope=bible&translation=HEB-SG');
  await expect(page.getByRole('link', { name: /HEB-SG/ }).first()).toBeVisible();
});

test('library pages fit the viewport', async ({ page }) => {
  for (const route of ['/library', '/reader?translations=LXX-SWETE', '/reader/john/3?translations=HEB-SG', '/search?q=ways&scope=all&translation=DID-HB']) {
    await page.goto(route);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, route).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  }
});


test('Living Letters links to edition-qualified passages', async ({ page }) => {
  await page.goto('/themes/living-letters');
  await expect(page.getByRole('link', { name: 'Hebrews 4:12 · Salkinson–Ginsburg Hebrew', exact: true })).toHaveAttribute('href', '/reader/hebrews/4?translations=HEB-SG#v12');
  await page.getByRole('link', { name: 'Greek Psalm 106:20 · compare Psalm 107:20', exact: true }).click();
  await expect(page).toHaveURL(/psalms\/106\?translations=LXX-SWETE#v20/);
  await expect(page.locator('#v20')).toContainText('ἰάσατο');
});

test('notes retain the selected work and edition', async ({ page }) => {
  await page.goto('/library');
  await page.getByRole('button', { name: 'Enable collection: Early Christian writings', exact: true }).click();
  await page.goto('/study-notes');
  await page.getByRole('button', { name: '+ New Note', exact: true }).click();
  await page.getByLabel('Note book').selectOption('93');
  await expect(page.getByLabel('Note edition')).toHaveValue('DID-HB');
  await page.getByPlaceholder('Your study notes, observations, or reflections...').fill('Compare the two ways of life and death.');
  await page.getByRole('button', { name: 'Save Note', exact: true }).click();
  const reference = page.getByRole('link', { name: /Didache 1 DID-HB/ });
  await expect(reference).toHaveAttribute('href', '/reader/didache/1?translations=DID-HB');
  await reference.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Didache 1');
});

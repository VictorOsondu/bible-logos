import { test, expect } from '@playwright/test';

test('malformed and repeated query parameters are safe', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const route of ['/search?q=word&q=light', '/search?q=word&offset=99999999999999999999999', '/reader/john/3?translations=HEB-SG&translations=KJV', '/reader?translations=HEB-SG&translations=KJV', '/compare?book=43&book=1&chapter=3&verse=16']) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('duplicate editions are rendered once, and unavailable readings do not enter history', async ({ page }) => {
  await page.goto('/reader/john/3?translations=HEB-SG,HEB-SG');
  await expect(page.getByRole('region', { name: 'Hebrew New Testament — Salkinson–Ginsburg' })).toHaveCount(1);
  const history = await page.evaluate(() => localStorage.getItem('biblelogos-history'));
  await page.goto('/reader/genesis/1?translations=HEB-SG');
  expect(await page.evaluate(() => localStorage.getItem('biblelogos-history'))).toBe(history);
  await page.goto('/reader/genesis/1?translations=NOT-INSTALLED');
  await expect(page.getByRole('status')).toContainText('NOT-INSTALLED');
  expect(await page.evaluate(() => localStorage.getItem('biblelogos-history'))).toBe(history);
});

test('parallel chapter choices survive navigation and removal of the primary edition', async ({ page }) => {
  await page.goto('/reader/psalms/107?translations=KJV,LXX-SWETE&chapters=KJV:107,LXX-SWETE:106');
  await page.getByRole('navigation', { name: 'Chapter navigation', exact: true }).getByRole('link', { name: /Next/ }).click();
  await expect(page.getByLabel('Chapter in KJV')).toHaveValue('108');
  await expect(page.getByLabel('Chapter in LXX-SWETE')).toHaveValue('106');
  await page.locator('summary', { hasText: 'Choose translations' }).click();
  await page.getByRole('link', { name: /^KJV King James Version/ }).click();
  await expect(page).toHaveURL(/psalms\/106\?translations=LXX-SWETE/);
  await expect(page.getByLabel('Chapter in LXX-SWETE')).toHaveValue('106');
});

test('book browser chooses the available category and retains comparison versions', async ({ page }) => {
  await page.goto('/reader?translations=HEB-SG');
  await expect(page.getByRole('button', { name: 'John', exact: true })).toBeVisible();
  await page.goto('/reader?book=psalms&translations=KJV,LXX-SWETE');
  const chapter = page.getByRole('region', { name: 'Chapters of Psalms' }).getByRole('link', { name: '107', exact: true });
  await expect(chapter).toHaveAttribute('href', '/reader/psalms/107?translations=KJV,LXX-SWETE');
});

test('malformed saved preferences and records do not crash library or personal pages', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('biblelogos-collections', 'null');
    localStorage.setItem('biblelogos-bookmarks', '[null,12,{"id":"bad"}]');
    localStorage.setItem('biblelogos-history', '[null,{"book":"bad"}]');
    localStorage.setItem('biblelogos-study-notes', '[null,{"id":"bad","tags":null}]');
  });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const route of ['/library', '/reader', '/bookmarks', '/study-notes', '/']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('source ranges, omissions and verse zero retain accurate references', async ({ page }) => {
  await page.goto('/reader/4-maccabees/8?translations=WEB-DC');
  await expect(page.locator('#v28')).toContainText('28-29');
  await page.goto('/reader/sirach/11?translations=WEB-DC');
  await expect(page.getByRole('complementary', { name: 'Source notes' })).toContainText('15-16');
  await expect(page.getByRole('complementary', { name: 'Source notes' })).toContainText('omitted');
  await page.goto('/reader/isaiah/1?translations=LXX-SWETE');
  await page.getByRole('button', { name: 'Bookmark Isaiah 1:0', exact: true }).click();
  await page.goto('/bookmarks');
  await expect(page.getByRole('link', { name: /Isaiah 1:0/ })).toHaveAttribute('href', '/reader/isaiah/1?translations=LXX-SWETE#v0');
});

test('notes validate references and can save a Greek prologue', async ({ page }) => {
  await page.goto('/library');
  await page.getByRole('button', { name: 'Enable collection: Deuterocanonical / Apocryphal books', exact: true }).click();
  await page.goto('/study-notes');
  await page.getByRole('button', { name: '+ New Note', exact: true }).click();
  const text = page.getByPlaceholder('Your study notes, observations, or reflections...');
  await text.fill('Reference audit');
  await page.getByPlaceholder('Verse (optional)', { exact: true }).fill('99999');
  await expect(page.getByRole('button', { name: 'Save Note', exact: true })).toBeDisabled();
  await page.getByLabel('Note book').selectOption('70');
  await page.getByLabel('Note edition').selectOption('LXX-SWETE');
  await page.getByLabel('Note chapter').selectOption('0');
  await page.getByRole('button', { name: 'Save Note', exact: true }).click();
  const note = page.getByRole('link', { name: /Esther \(Greek\) prologue LXX-SWETE/ });
  await expect(note).toHaveAttribute('href', '/reader/esther-(greek)/0?translations=LXX-SWETE');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('button', { name: /Delete note for/ })).toBeVisible();
});

test('narrow screens accommodate enabled collections and forms', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => localStorage.setItem('biblelogos-collections', '["deuterocanon","early-christian","second-temple"]'));
  for (const route of ['/reader', '/search?scope=all', '/library', '/study-notes', '/bookmarks']) {
    await page.goto(route);
    if (route === '/study-notes') await page.getByRole('button', { name: '+ New Note', exact: true }).click();
    if (route === '/bookmarks') await page.getByRole('button', { name: 'Add', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), route).toBeLessThanOrEqual(320);
  }
});

test('failed browser storage writes retain the current session and explain persistence limits', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage is full', 'QuotaExceededError'); };
  });
  await page.goto('/reader/psalms/23');
  await expect(page.getByText(/Browser storage could not save your changes/)).toBeVisible();
  await page.getByRole('button', { name: 'Verse 1: show study tools', exact: true }).click();
  await page.getByRole('button', { name: 'Bookmark', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
});

test('bookmarks work when randomUUID is unavailable on a local HTTP origin', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true }));
  await page.goto('/reader/john/3?translations=HEB-SG');
  const bookmark = page.getByRole('button', { name: 'Bookmark John 3:16', exact: true });
  await bookmark.click();
  await expect(page.getByRole('button', { name: 'Remove bookmark for John 3:16', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('manual references reject genuinely omitted verse numbers inside valid bounds', async ({ page }) => {
  await page.goto('/study-notes');
  await page.getByRole('button', { name: '+ New Note', exact: true }).click();
  await page.getByLabel('Note book').selectOption('40');
  await page.getByLabel('Note edition').selectOption('ASV');
  await page.getByLabel('Note chapter').selectOption('17');
  await page.getByLabel('Note text').fill('Testing a source-specific reference.');
  await page.getByLabel('Note verse (optional)').fill('21');
  await expect(page.getByRole('button', { name: 'Save Note', exact: true })).toBeDisabled();
  await page.getByLabel('Note verse (optional)').fill('22');
  await expect(page.getByRole('button', { name: 'Save Note', exact: true })).toBeEnabled();
  await page.goto('/bookmarks');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Bookmark book').selectOption('40');
  await page.getByLabel('Bookmark edition').selectOption('ASV');
  await page.getByLabel('Bookmark chapter').selectOption('17');
  await page.getByLabel('Verse (optional)').fill('21');
  await expect(page.getByRole('button', { name: 'Save bookmark', exact: true })).toBeDisabled();
});

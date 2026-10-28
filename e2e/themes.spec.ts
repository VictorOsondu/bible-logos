import { test, expect } from '@playwright/test';

test('themes show the hierarchy and search within sub-themes', async ({ page }) => {
  await page.goto('/themes');
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(['New Creation', 'The Godhead', 'Living Letters', 'Jesus', 'Creation', 'The Bible']);
  for (const name of ['Sin →', 'Redemption →', 'Sanctification →', 'Justification →', 'The Old Testament →', 'The New Testament →']) {
    await expect(page.getByRole('main').getByRole('link', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText('Sub-themes', { exact: true })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Find a theme' }).fill('Testament');
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(['The Bible']);
  await page.getByRole('link', { name: 'The Bible', exact: true }).click();
  const bibleChildren = page.getByRole('region', { name: 'Sub-themes' });
  await expect(bibleChildren.getByRole('link')).toHaveText(['The Old Testament →', 'The New Testament →']);
  await bibleChildren.getByRole('link', { name: 'The Old Testament →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Old Testament');
  await expect(page.getByRole('navigation', { name: 'Theme breadcrumb' }).getByRole('link', { name: 'The Bible' })).toHaveAttribute('href', '/themes/the-bible');
  await page.goto('/themes');
  await page.getByRole('searchbox', { name: 'Find a theme' }).fill('redemption');
  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(['New Creation']);
  await page.getByRole('searchbox', { name: 'Find a theme' }).fill('no-such-theme');
  await expect(page.getByText('No themes match. Try another theme or sub-theme.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find a theme' }).clear();
  await page.getByRole('link', { name: 'New Creation', exact: true }).click();
  const children = page.getByRole('region', { name: 'Sub-themes' });
  await expect(children.getByRole('link')).toHaveText(['Sin →', 'Redemption →', 'Sanctification →', 'Justification →']);
  await children.getByRole('link', { name: 'Redemption →', exact: true }).click();
  await expect(page).toHaveURL(/\/themes\/redemption$/);
  await expect(page.getByRole('navigation', { name: 'Theme breadcrumb' }).getByRole('link', { name: 'New Creation' })).toHaveAttribute('href', '/themes/new-creation');
  for (const name of ['Key passages', 'Original-language insights', 'Reflect and respond', 'Related studies']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Ephesians 1:3–14' })).toHaveAttribute('href', '/reader/ephesians/1#v3');
  await expect(page.getByRole('link', { name: /apolytrōsis/ })).toHaveAttribute('href', '/word/G629');
  await expect(page.getByRole('link', { name: 'CC BY-NC 4.0' })).toHaveAttribute('rel', 'license');
});

test('new themes have their own pages awaiting content', async ({ page }) => {
  for (const [slug, title] of [['the-godhead', 'The Godhead'], ['jesus', 'Jesus'], ['creation', 'Creation'], ['the-old-testament', 'The Old Testament'], ['the-new-testament', 'The New Testament']]) {
    await page.goto(`/themes/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Study content to follow.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sub-themes' })).toHaveCount(0);
  }
});

test('reflections persist separately for each topic', async ({ page }) => {
  await page.goto('/themes/redemption');
  await page.getByLabel('Your reflection', { exact: true }).fill('Rescue and belonging.');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await expect(page.getByRole('status')).toContainText('Reflection saved');
  await page.reload();
  await expect(page.getByLabel('Your reflection', { exact: true })).toHaveValue('Rescue and belonging.');
  await page.getByRole('link', { name: 'Sanctification →', exact: true }).click();
  await expect(page.getByLabel('Your reflection', { exact: true })).toHaveValue('');
  await page.goto('/themes/redemption');
  await expect(page.getByLabel('Your reflection', { exact: true })).toHaveValue('Rescue and belonging.');
});

test('unknown studies return 404 and the licence notice is available', async ({ request }) => {
  for (const slug of ['unknown-study', 'lovingkindness', 'holiness', 'sovereignty', 'suffering', 'second-coming']) {
    expect((await request.get(`/themes/${slug}`)).status(), slug).toBe(404);
  }
  const notice = await request.get('/themes-licence.txt');
  expect(notice.status()).toBe(200);
  expect(await notice.text()).toContain('Attribution-NonCommercial 4.0');
});


test('Living Letters presents the study and credits its source at the end', async ({ page }) => {
  await page.goto('/themes/living-letters');
  await expect(page.getByRole('heading', { name: 'Living Letters', exact: true })).toBeVisible();
  await expect(page.getByText('Study content to follow.', { exact: true })).toHaveCount(0);
  const chart = page.getByRole('group', { name: 'Living letters chart', exact: true });
  await expect(chart.getByRole('button')).toHaveCount(22);
  for (const name of ['Three mothers', 'Seven doubles', 'Twelve simples']) {
    await expect(chart.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: '2 Corinthians 3:1–6', exact: true })).toHaveAttribute('href', '/reader/2-corinthians/3#v1');
  const source = page.getByRole('region', { name: 'Source', exact: true });
  await expect(source).toContainText('William Wynn Westcott');
  await expect(source).toContainText('Darcy Kuntz');
  await expect(source).toContainText('Holmes Publishing Group, 1996');
  await expect(source).toContainText('1-55818-333-7');
  await expect(page.getByRole('heading', { level: 2 }).last()).toHaveText('Source');
  await expect(page.getByLabel('Your reflection', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});


test('letter chart opens meanings and usage for every letter', async ({ page }) => {
  await page.goto('/themes/living-letters');
  const chart = page.getByRole('group', { name: 'Living letters chart', exact: true });
  const buttons = chart.getByRole('button');
  await expect(buttons).toHaveCount(22);
  for (let index = 0; index < 22; index++) {
    const button = buttons.nth(index);
    const name = (await button.getAttribute('aria-label'))!.split(' — ')[0];
    await button.click();
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Living letter meaning', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Usage in the Book of Formation', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Explore the shape', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Listen and compare', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Golden Dawn interpretation', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: `Play pronunciation of ${name}`, exact: true })).toBeVisible();
    await expect(dialog).toContainText('Tree of Life');
    await expect(dialog).toContainText('Golden Dawn Correspondence Course');
    await dialog.getByRole('button', { name: 'Close letter details' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(button).toBeFocused();
  }
});

test('letter modal supports keyboard, backdrop dismissal and mobile sizing', async ({ page }) => {
  await page.goto('/themes/living-letters');
  const aleph = page.getByRole('group', { name: 'Hebrew alphabet chart', exact: true }).getByRole('button', { name: 'Aleph — א', exact: true });
  await aleph.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Aleph', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Air and mediation.');
  await expect(dialog).toContainText('temperate conditions');
  const close = dialog.getByRole('button', { name: 'Close letter details' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: /Audio source: Polly Lingual/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Play pronunciation of Aleph' })).toBeFocused();
  await close.focus();
  expect(await page.locator('body').evaluate(body => body.style.overflow)).toBe('hidden');
  const bounds = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(aleph).toBeFocused();
  await expect.poll(() => page.locator('body').evaluate(body => body.style.overflow)).not.toBe('hidden');
  await aleph.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await expect(aleph).toBeFocused();
});

test('Gematria is a linked sub-theme with numerical and combination methods', async ({ page }) => {
  await page.goto('/themes/living-letters');
  await page.getByRole('region', { name: 'Sub-themes' }).getByRole('link', { name: 'Gematria →' }).click();
  await expect(page).toHaveURL(/\/themes\/gematria$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gematria');
  await expect(page.getByRole('navigation', { name: 'Theme breadcrumb' }).getByRole('link', { name: 'Living Letters' })).toHaveAttribute('href', '/themes/living-letters');
  for (const name of ['Letters as numbers', 'Letters in relationship', 'Notariqon: letters unfolded into words', 'Temurah: exchanging and rearranging letters']) {
    await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible();
  }
  await expect(page.getByText(/1 \+ 8 \+ 4 = 13/)).toBeVisible();
});

test('pronunciation loads on request, plays, stops and pauses when the dialog closes', async ({ page }) => {
  // A real PCM waveform exercises the browser media player without depending on an external host.
  const samples = 8000 * 5;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(36 + samples * 2, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / 8000) * 3000), 44 + i * 2);
  let audioRequests = 0;
  await page.route('https://s3.amazonaws.com/lang_src/**', async route => {
    audioRequests++;
    await route.fulfill({ contentType: 'audio/wav', body: wav });
  });
  await page.goto('/themes/living-letters');
  await page.getByRole('group', { name: 'Hebrew alphabet chart', exact: true }).getByRole('button', { name: 'Aleph — א' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aleph', exact: true });
  expect(audioRequests).toBe(0);
  await expect(dialog.locator('audio')).not.toHaveAttribute('src');
  await dialog.getByRole('button', { name: 'Play pronunciation of Aleph' }).click();
  await expect(dialog.getByRole('button', { name: 'Stop pronunciation of Aleph' })).toBeVisible();
  await expect.poll(() => dialog.locator('audio').evaluate(audio => !(audio as HTMLAudioElement).paused)).toBe(true);
  await dialog.getByRole('button', { name: 'Stop pronunciation of Aleph' }).click();
  await expect(dialog.getByRole('button', { name: 'Play pronunciation of Aleph' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Play pronunciation of Aleph' }).click();
  await expect(dialog.getByRole('button', { name: 'Stop pronunciation of Aleph' })).toBeVisible();
  await dialog.locator('audio').evaluate(audio => { (window as unknown as { lastAudio: HTMLAudioElement }).lastAudio = audio as HTMLAudioElement; });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { lastAudio: HTMLAudioElement }).lastAudio.paused)).toBe(true);
});

test('unavailable pronunciation offers a source link and keeps the dialog usable', async ({ page }) => {
  await page.route('https://s3.amazonaws.com/lang_src/**', route => route.abort());
  await page.goto('/themes/living-letters');
  await page.getByRole('group', { name: 'Hebrew alphabet chart', exact: true }).getByRole('button', { name: 'Aleph — א' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aleph', exact: true });
  await dialog.getByRole('button', { name: 'Play pronunciation of Aleph' }).click();
  await expect(dialog.getByRole('status')).toContainText('Audio could not play');
  await expect(dialog.getByRole('link', { name: /Audio source: Polly Lingual/ })).toHaveAttribute('href', 'https://pollylingu.al/he/en/alphabet');
  await expect(dialog.getByRole('button', { name: 'Play pronunciation of Aleph' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});


test('complete alphabet chart precedes key passages in Hebrew letter order', async ({ page }) => {
  await page.goto('/themes/living-letters');
  const chart = page.getByRole('group', { name: 'Hebrew alphabet chart', exact: true });
  await expect(chart.getByRole('button')).toHaveText([
    'אAleph', 'בBeth', 'גGimel', 'דDaleth', 'הHeh', 'וVau', 'זZain', 'חCheth', 'טTeth', 'יYod', 'כKaph',
    'לLamed', 'מMem', 'נNun', 'סSamech', 'עOin', 'פPeh', 'צTzaddi', 'קQoph', 'רResh', 'שShin', 'תTau',
  ]);
  expect(await chart.evaluate(element => Boolean(element.compareDocumentPosition(document.getElementById('key-passages')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(chart).toHaveAttribute('dir', 'rtl');
  await chart.getByRole('button', { name: 'Tau — ת', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tau', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await chart.getByRole('button', { name: 'Aleph — א', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Aleph', exact: true })).toContainText('Air and mediation.');
});

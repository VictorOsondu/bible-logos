// Takes the README screenshots from a running production build:
//   npm run build && npm start   (in another terminal)
//   npm run screenshots           (BASE_URL defaults to http://localhost:3000)
// CHROMIUM_PATH optionally points at an already-installed Chromium.

import { chromium, devices } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:3000';
const out = 'docs/screenshots';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function desktop(colorScheme = 'light') {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme });
  return page;
}

// The reader, with a word's Hebrew original open beside the text
let page = await desktop();
await page.goto(`${base}/reader/psalms/23`);
await page.locator('#v1').getByRole('button', { name: 'my shepherd', exact: true }).click();
await page.getByRole('complementary', { name: /^Strong's/ }).waitFor();
await page.mouse.move(640, 790); // away from the text, so no word shows its hover colour
await page.waitForTimeout(1000); // let the entry load
await page.screenshot({ path: `${out}/reader.png` });

// Translations side by side, in the dark theme
page = await desktop('dark');
await page.goto(`${base}/reader/john/1?translations=KJV,BSB,LSV`);
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/parallel-dark.png` });

// Choosing translations, with the sidebar collapsed to icons
page = await desktop();
await page.goto(`${base}/reader/romans/8`);
await page.getByRole('button', { name: 'Collapse sidebar' }).click();
await page.locator('summary', { hasText: 'Choose translations' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/translations.png` });
await page.getByRole('button', { name: 'Expand sidebar' }).click();

// A Strong's concordance entry
page = await desktop();
await page.goto(`${base}/word/H2617`);
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/concordance.png` });

// Cross-references for a verse
page = await desktop();
await page.goto(`${base}/reader/john/3`);
await page.getByRole('button', { name: 'Verse 16: show study tools' }).click();
await page.getByText(/cross-references? found/).waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/cross-references.png` });

// The reader on a phone
const phone = await browser.newPage({ ...devices['Pixel 7'], deviceScaleFactor: 2 });
await phone.goto(`${base}/reader/john/1`);
await phone.waitForTimeout(300);
await phone.screenshot({ path: `${out}/mobile.png` });

await browser.close();
console.log(`Screenshots saved in ${out}/`);

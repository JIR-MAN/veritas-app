/**
 * Captures key screens at phone and tablet sizes, light and dark, from the web
 * build. Output: artifacts/screens/<device>-<scheme>-<screen>.png
 *   node e2e/screenshots.cjs [scale]
 */
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { start } = require('./serve.cjs');

const DEVICES = {
  'iphone-se': { width: 375, height: 667 },
  'iphone-pro-max': { width: 440, height: 956 },
  'android-phone': { width: 412, height: 915 },
  'ipad-portrait': { width: 834, height: 1194 },
  'ipad-landscape': { width: 1194, height: 834 },
  'android-tablet': { width: 800, height: 1280 },
};
const scale = +process.argv[2] || 1;
const only = process.argv[3];

(async () => {
  mkdirSync('artifacts/screens', { recursive: true });
  const srv = await start(8091);
  const browser = await chromium.launch();
  const base = 'http://localhost:8091';
  for (const [name, viewport] of Object.entries(DEVICES)) {
    if (only && !name.includes(only)) continue;
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: scheme });
      const page = await ctx.newPage();
      const shot = (s) => page.screenshot({ path: `artifacts/screens/${name}-${scheme}-${s}.png` });
      await page.goto(base + '/');
      await page.getByText('Check a file').first().waitFor();
      await shot('1-home-empty');
      await page.goto(base + '/check');
      await page.getByText('On device').first().waitFor({ timeout: 60000 });
      await shot('2-check');
      await page.getByTestId('sample-tampered').click();
      await page.getByTestId('verdict').waitFor({ timeout: 60000 });
      await page.waitForTimeout(300);
      await shot('3-result-tampered');
      await page.getByTestId('save-evidence').click();
      await page.getByTestId('save-new-case').click();
      await page.getByText('Fingerprint', { exact: true }).waitFor({ timeout: 30000 });
      await page.waitForTimeout(300);
      await shot('4-evidence');
      await page.goto(base + '/check');
      await page.getByText('On device').first().waitFor({ timeout: 60000 });
      await page.getByTestId('sample-ai').click();
      await page.getByTestId('verdict').waitFor({ timeout: 60000 });
      await page.waitForTimeout(300);
      await shot('5-result-ai');
      await page.getByTestId('more-watermark').click();
      await page.getByTestId('wm-download').waitFor({ timeout: 30000 });
      await page.waitForTimeout(300);
      await shot('5b-watermark');
      await page.goto(base + '/cases');
      await page.getByText(/^Case /).first().waitFor();
      await page.waitForTimeout(300);
      await shot('6-cases');
      await page.goto(base + '/');
      await page.getByText('Recent cases').waitFor();
      await shot('7-home');
      await page.goto(base + '/case/new');
      await page.getByTestId('cat-scam').click();
      await shot('8-new-case');
      await ctx.close();
      console.log('done', name, scheme);
    }
  }
  await browser.close();
  srv.close();
})();

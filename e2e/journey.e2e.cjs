/**
 * End-to-end journey on the web build (same React Native code as the apps):
 * Check sample -> Save as evidence -> case -> note -> export data.
 * Verifies real outputs: the engine verdict, the SHA-256 (against Node's own
 * hash of the same file) and the exported report contents.
 *
 *   npx expo export -p web --output-dir dist && node e2e/journey.e2e.cjs
 */
const { chromium } = require('playwright');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const { start } = require('./serve.cjs');

const root = join(__dirname, '..');
const sha = (f) => createHash('sha256').update(readFileSync(join(root, f))).digest('hex');
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
    throw e;
  }
}

(async () => {
  const srv = await start(8090);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = 'http://localhost:8090';
  try {
    await step('home loads', async () => {
      await page.goto(base + '/');
      await page.getByText('Check a file').first().waitFor();
    });

    await step('engine starts on device', async () => {
      await page.goto(base + '/check');
      await page.getByText('On device').first().waitFor({ timeout: 60000 });
    });

    const verdicts = {
      none: 'Origin unknown',
      tampered: 'Credentials failed validation',
      ai: 'Signed by an unrecognised source',
      camera: 'Signed by an unrecognised source',
    };
    for (const [key, headline] of Object.entries(verdicts)) {
      await step(`sample "${key}" -> ${headline}`, async () => {
        await page.goto(base + '/check');
        await page.getByText('On device').first().waitFor({ timeout: 60000 });
        await page.getByTestId(`sample-${key}`).click();
        await page.getByTestId('verdict').waitFor({ timeout: 60000 });
        const text = await page.getByTestId('verdict').innerText();
        assert.ok(text.includes(headline), `verdict was: ${text}`);
        assert.ok(await page.getByText('Not checked. Paid detection services are switched off until approved.').isVisible());
      });
    }

    await step('more ways to check: watermark, search and SynthID, error levels', async () => {
      await page.goto(base + '/check');
      await page.getByText('On device').first().waitFor({ timeout: 60000 });
      await page.getByTestId('sample-none').click();
      await page.getByTestId('verdict').waitFor({ timeout: 60000 });
      // The TrustMark reader is never downloaded without the user's tap.
      await page.getByTestId('more-watermark').click();
      await page.getByTestId('wm-download').waitFor({ timeout: 30000 });
      await page.goBack();
      await page.getByTestId('more-search').click();
      await page.getByText('Google SynthID Detector').waitFor();
      await page.goBack();
      await page.getByTestId('more-ela').click();
      await page.getByLabel('Error level analysis image').waitFor({ timeout: 60000 });
    });

    await step('save tampered sample as evidence in a new case', async () => {
      await page.goto(base + '/check');
      await page.getByText('On device').first().waitFor({ timeout: 60000 });
      await page.getByTestId('sample-tampered').click();
      await page.getByTestId('verdict').waitFor({ timeout: 60000 });
      await page.getByTestId('save-evidence').click();
      await page.getByPlaceholder('https://').fill('https://example.com/post/123');
      await page.getByTestId('save-new-case').click();
      await page.getByText('Fingerprint', { exact: true }).waitFor({ timeout: 30000 });
    });

    await step('SHA-256 matches an independent hash of the same file', async () => {
      const expected = sha('assets/samples/sample-tampered.jpg');
      const shown = (await page.getByText(/^[0-9a-f]{8}( [0-9a-f]{8}){7}$/).innerText()).replace(/\s/g, '');
      assert.equal(shown, expected);
    });

    await step('add a timeline note', async () => {
      await page.getByText(/^Case /).first().click();
      await page.getByTestId('add-note').click();
      await page.getByTestId('note-text').fill('Saw the altered photo shared in a group chat.');
      await page.getByTestId('save-note').click();
      await page.getByText('Saw the altered photo shared in a group chat.').first().waitFor();
    });

    await step('export data contains hash, verdict, note and disclaimers', async () => {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Export data (JSON)').click()]);
      const data = JSON.parse(readFileSync(await dl.path(), 'utf8'));
      assert.equal(data.evidence[0].sha256, sha('assets/samples/sample-tampered.jpg'));
      assert.equal(data.evidence[0].contentCredentials.verdict, 'credentials_invalid');
      assert.equal(data.evidence[0].sourceUrlAsEnteredByUser, 'https://example.com/post/123');
      assert.ok(data.chronology.some((c) => c.source === 'user' && c.text.includes('group chat')));
      assert.ok(data.disclaimers.some((d) => /not legal advice/i.test(d)));
      assert.ok(!JSON.stringify(data).match(/admissible(?! or)/i));
    });

    await step('case persists after reload', async () => {
      await page.goto(base + '/cases');
      await page.getByText(/^Case /).first().waitFor();
    });

    await step('delete all data', async () => {
      page.on('dialog', (d) => d.accept());
      await page.goto(base + '/settings');
      await page.getByText('Delete all data').click();
      await page.goto(base + '/cases');
      await page.getByText('No cases yet').waitFor();
    });

    await step('no uncaught page errors', async () => assert.deepEqual(errors, []));
  } catch {
    // reported below
  } finally {
    for (const r of results) console.log(r.join('  '));
    await browser.close();
    srv.close();
    process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
  }
})();

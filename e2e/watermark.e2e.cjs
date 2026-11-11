/**
 * TrustMark watermark reader test. Needs internet access to Adobe's model host
 * and to the adobe/trustmark sample images, so it runs on GitHub's runners
 * (see .github/workflows/watermark.yml).
 *
 * 1. Reader page: loads the real models into assets/engine/watermark-engine.html
 *    and decodes Adobe's own watermarked and plain sample images.
 * 2. Web app (needs `npx expo export -p web --output-dir dist`): the user flow,
 *    including the in-browser download from Adobe, on a sample with no watermark.
 *
 *   node e2e/watermark.e2e.cjs            # both parts
 *   node e2e/watermark.e2e.cjs --reader   # part 1 only
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdirSync, readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = join(__dirname, '..');
const MODEL_BASE = 'https://cai-watermark.adobe.net/watermarking/trustmark-models/';
const MODELS = ['decoder_Q.onnx', 'decoder_P.onnx', 'resizer.onnx'];
const IMAGES_BASE = 'https://raw.githubusercontent.com/adobe/trustmark/main/images/';
// Adobe's samples: *_Q / *_P files carry a watermark, the originals don't.
const EXPECT = { 'ufo_240_Q.png': true, 'ufo_240_P.png': true, 'ghost_P.png': true, 'ufo_240.jpg': false, 'ghost.png': false };
const cache = join(root, 'artifacts/trustmark');

async function get(url) {
  const f = join(cache, url.split('/').pop());
  if (existsSync(f)) return readFileSync(f);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(f, b);
  return b;
}

async function readerTest() {
  mkdirSync(cache, { recursive: true });
  const models = {};
  for (const m of MODELS) {
    models[m] = await get(MODEL_BASE + m);
    console.log(`model ${m}: ${models[m].length} bytes, sha256 ${createHash('sha256').update(models[m]).digest('hex')}`);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = [];
  await page.exposeFunction('__veritasOut', (s) => out.push(JSON.parse(s)));
  await page.goto(pathToFileURL(join(root, 'assets/engine/watermark-engine.html')).href);
  const wait = async (pred, ms = 120000) => {
    const t = Date.now();
    for (;;) {
      const m = out.find(pred);
      if (m) return m;
      if (Date.now() - t > ms) throw new Error('timeout');
      await new Promise((r) => setTimeout(r, 25));
    }
  };
  const send = (m) => page.evaluate((s) => window.__veritas.receive(s), JSON.stringify(m));
  console.log('ready:', JSON.stringify((await wait((m) => m.type === 'ready')).info));
  const CH = 512 * 1024;
  for (const m of MODELS) {
    for (let i = 0; i < models[m].length; i += CH) await send({ type: 'model', name: m, b64: models[m].subarray(i, i + CH).toString('base64') });
    await send({ type: 'model', name: m, done: true });
  }
  await send({ type: 'load' });
  const loaded = await wait((m) => m.type === 'models_loaded' || m.code === 'models_failed');
  assert.equal(loaded.type, 'models_loaded', JSON.stringify(loaded));
  let n = 0;
  for (const [img, present] of Object.entries(EXPECT)) {
    const bytes = await get(IMAGES_BASE + img);
    const id = `t${++n}`;
    await send({ type: 'begin', id, mime: img.endsWith('png') ? 'image/png' : 'image/jpeg', size: bytes.length });
    for (let i = 0; i < bytes.length; i += CH) await send({ type: 'chunk', id, b64: bytes.subarray(i, i + CH).toString('base64') });
    await send({ type: 'end', id });
    const r = await wait((m) => m.id === id);
    console.log(img, JSON.stringify(r));
    assert.equal(r.type, 'watermark', JSON.stringify(r));
    assert.equal(r.result.present, present, `${img}: expected present=${present}`);
  }
  await browser.close();
  console.log('PASS reader decodes Adobe samples');
}

async function appTest() {
  const { start } = require('./serve.cjs');
  const srv = await start(8091);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('dialog', (d) => d.accept());
  const base = 'http://localhost:8091';
  try {
    await page.goto(base + '/check');
    await page.getByText('On device').waitFor({ timeout: 60000 });
    await page.getByTestId('sample-none').click();
    await page.getByTestId('verdict').waitFor({ timeout: 60000 });
    await page.getByTestId('more-watermark').click();
    await page.getByTestId('wm-download').click();
    await page.getByText(/No TrustMark watermark found|TrustMark watermark found|Couldn’t read this image|download didn’t finish/).first().waitFor({ timeout: 300000 });
    mkdirSync(join(root, 'artifacts/screens'), { recursive: true });
    await page.screenshot({ path: join(root, 'artifacts/screens/watermark-web.png'), fullPage: true });
    const body = await page.locator('body').innerText();
    assert.match(body, /No TrustMark watermark found/, body.slice(0, 800));
    console.log('PASS web app downloads the reader and reads a sample');
  } finally {
    await browser.close();
    srv.close();
  }
}

(async () => {
  await readerTest();
  if (!process.argv.includes('--reader')) await appTest();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

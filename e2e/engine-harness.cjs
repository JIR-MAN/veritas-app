// Loads the built engine HTML in headless Chromium and runs files through it
// using the same chunked protocol the app uses. Exported for tests and CLI use.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', wav: 'audio/wav', mp3: 'audio/mpeg' };

async function openEngine(htmlPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = [];
  await page.exposeFunction('__veritasOut', (s) => out.push(JSON.parse(s)));
  await page.goto(pathToFileURL(htmlPath).href);
  const t0 = Date.now();
  while (!out.find((m) => m.type === 'ready' || m.code === 'init_failed')) {
    if (Date.now() - t0 > 60000) throw new Error('engine did not start');
    await new Promise((r) => setTimeout(r, 50));
  }
  let n = 0;
  async function check(path, mime) {
    const id = 'job' + ++n;
    const bytes = readFileSync(path);
    mime = mime || MIME[path.split('.').pop().toLowerCase()] || 'application/octet-stream';
    const send = (m) => page.evaluate((s) => window.__veritas.receive(s), JSON.stringify(m));
    await send({ type: 'begin', id, mime, size: bytes.length });
    const CH = 512 * 1024;
    for (let i = 0; i < bytes.length; i += CH) await send({ type: 'chunk', id, b64: bytes.subarray(i, i + CH).toString('base64') });
    await send({ type: 'end', id });
    const t = Date.now();
    for (;;) {
      const m = out.find((x) => x.id === id);
      if (m) return m;
      if (Date.now() - t > 60000) throw new Error('timeout ' + path);
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  return { check, ready: out.find((m) => m.type === 'ready'), close: () => browser.close() };
}
module.exports = { openEngine };

if (require.main === module) {
  (async () => {
    const [html, ...files] = process.argv.slice(2);
    const eng = await openEngine(html);
    console.log(JSON.stringify(eng.ready));
    for (const f of files) {
      const r = await eng.check(f);
      console.log('=====', f);
      console.log(JSON.stringify(r).slice(0, 3000));
    }
    await eng.close();
  })().catch((e) => { console.error(e); process.exit(1); });
}

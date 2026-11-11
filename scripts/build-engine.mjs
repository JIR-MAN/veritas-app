// Bundles engine/engine.ts into a single self-contained HTML file that the app
// loads into a WebView (native) or iframe (web).
//   node scripts/build-engine.mjs          -> assets/engine/c2pa-engine.html (production)
//   node scripts/build-engine.mjs --test   -> fixtures/engine-test.html (also trusts the c2pa-rs test CA)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const test = process.argv.includes('--test');
const trustMeta = JSON.parse(readFileSync(join(root, 'assets/trust/SOURCES.json'), 'utf8'));

const result = await build({
  entryPoints: [join(root, 'engine/engine.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  target: ['safari15', 'chrome100'],
  minify: !test,
  loader: { '.pem': 'text', '.cfg': 'text' },
  define: {
    __TRUST_LISTS_FETCHED__: JSON.stringify(trustMeta.fetched),
    __EXTRA_USER_ANCHORS__: JSON.stringify(test ? readFileSync(join(root, 'fixtures/certs/es256.pub'), 'utf8') : ''),
  },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:; worker-src blob: data:; connect-src data: blob:;">
<title>VERITAS engine</title></head><body><script>${js}</script></body></html>`;
const out = test ? join(root, 'fixtures/engine-test.html') : join(root, 'assets/engine/c2pa-engine.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(out, (statSync(out).size / 1e6).toFixed(1) + ' MB');

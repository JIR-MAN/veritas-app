/**
 * Runs the real engine bundle in Chromium against every fixture and checks the
 * raw c2pa-rs verdicts. Guards against library upgrades silently changing results.
 *   node e2e/engine.e2e.cjs
 */
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { openEngine } = require('./engine-harness.cjs');

const root = join(__dirname, '..');
const EXPECT = {
  test: {
    'generated/ai-declared.jpg': 'Trusted',
    'generated/camera-capture.jpg': 'Trusted',
    'generated/ai-declared-tampered.jpg': 'Invalid',
  },
  prod: {
    'generated/ai-declared.jpg': 'Valid',
    'generated/ai-declared-tampered.jpg': 'Invalid',
    'generated/no-credentials.jpg': 'none',
    'generated/not-an-image.jpg': 'error:unsupported',
    'c2pa-rs/CA.jpg': 'Valid',
    'c2pa-rs/XCA.jpg': 'Invalid',
    'c2pa-rs/E-sig-CA.jpg': 'Invalid',
    'c2pa-rs/cloud.jpg': 'remote',
    'c2pa-rs/video1.mp4': 'Valid',
    'c2pa-rs/sample1.png': 'none',
    'c2pa-rs/sample1.wav': 'none',
  },
};
const summarize = (r) =>
  r.type === 'error' ? `error:${r.code}` : r.report.remoteManifestUrl ? 'remote' : r.report.hasManifest ? r.report.store.validation_state : 'none';

(async () => {
  let failed = 0;
  for (const [mode, html] of [['test', 'fixtures/engine-test.html'], ['prod', 'assets/engine/c2pa-engine.html']]) {
    const eng = await openEngine(join(root, html));
    for (const [f, want] of Object.entries(EXPECT[mode])) {
      const got = summarize(await eng.check(join(root, 'fixtures', f)));
      try {
        assert.equal(got, want);
        console.log('PASS ', mode, f, got);
      } catch {
        failed++;
        console.log('FAIL ', mode, f, `got ${got}, want ${want}`);
      }
    }
    await eng.close();
  }
  process.exit(failed ? 1 : 0);
})();

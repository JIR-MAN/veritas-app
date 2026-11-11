// Runs every fixture through the real engine (Chromium) and saves the raw
// engine responses. Unit tests for the result classifier use these files, so
// the classifier is tested against genuine c2pa-rs output, not invented JSON.
const { openEngine } = require('../e2e/engine-harness.cjs');
const { readdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
(async () => {
  const root = join(__dirname, '..');
  for (const [mode, html] of [['test', 'fixtures/engine-test.html'], ['prod', 'assets/engine/c2pa-engine.html']]) {
    const eng = await openEngine(join(root, html));
    for (const dir of ['generated', 'c2pa-rs']) {
      for (const f of readdirSync(join(root, 'fixtures', dir))) {
        const r = await eng.check(join(root, 'fixtures', dir, f));
        if (r.report) delete r.report.ms;
        writeFileSync(join(root, 'fixtures/reports', `${mode}--${dir}--${f}.json`), JSON.stringify(r, null, 1));
        console.log(mode, dir, f, r.type, r.code || (r.report.hasManifest ? (r.report.store.validation_state || 'manifest') : 'none'));
      }
    }
    await eng.close();
  }
})();

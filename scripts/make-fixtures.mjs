// Generates deterministic C2PA test fixtures with known ground truth.
// Signed with the public c2pa-rs TEST certificate (never trusted in production).
// Run: node scripts/make-fixtures.mjs
import { Builder, LocalSigner } from '@contentauth/c2pa-node';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = join(root, 'fixtures');
const out = join(fx, 'generated');
mkdirSync(out, { recursive: true });

const cert = readFileSync(join(fx, 'certs/es256.pub'));
const key = readFileSync(join(fx, 'certs/es256.pem'));
const signer = LocalSigner.newSigner(cert, key, 'es256');
const base = join(fx, 'c2pa-rs/no_manifest.jpg');

async function sign(name, sourceType, title) {
  const builder = await Builder.withJsonAsync({
    claim_generator_info: [{ name: 'VERITAS test fixture generator', version: '1.0.0' }],
    title,
    format: 'image/jpeg',
  });
  builder.setIntent({ create: sourceType });
  const dest = join(out, name);
  builder.sign(signer, { path: base, mimeType: 'image/jpeg' }, { path: dest });
  return dest;
}

const IPTC = 'http://cv.iptc.org/newscodes/digitalsourcetype/';
const ai = await sign('ai-declared.jpg', IPTC + 'trainedAlgorithmicMedia', 'AI declared');
await sign('camera-capture.jpg', IPTC + 'digitalCapture', 'Camera capture');

// Tampered: flip bytes near the end of the image data (after the manifest),
// which breaks the hard-binding hash while leaving the manifest intact.
const bytes = readFileSync(ai);
for (let i = bytes.length - 400; i < bytes.length - 300; i++) bytes[i] ^= 0xff;
writeFileSync(join(out, 'ai-declared-tampered.jpg'), bytes);

copyFileSync(base, join(out, 'no-credentials.jpg'));
writeFileSync(join(out, 'not-an-image.jpg'), 'This is plain text pretending to be a JPEG.\n');
console.log('fixtures written to', out);

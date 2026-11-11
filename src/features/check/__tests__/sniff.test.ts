import { sniffMime } from '../engine-protocol';
import { readFileSync } from 'fs';
import { join } from 'path';

const head = (f: string) => new Uint8Array(readFileSync(join(__dirname, '../../../../fixtures', f)).subarray(0, 32));

test.each([
  ['c2pa-rs/no_manifest.jpg', 'image/jpeg'],
  ['c2pa-rs/sample1.png', 'image/png'],
  ['c2pa-rs/sample1.webp', 'image/webp'],
  ['c2pa-rs/sample1.wav', 'audio/wav'],
  ['c2pa-rs/sample1.mp3', 'audio/mpeg'],
  ['c2pa-rs/video1.mp4', 'video/mp4'],
])('%s is detected as %s from its bytes', (f, mime) => {
  expect(sniffMime(head(f))).toBe(mime);
});

test('a text file named .jpg is not treated as an image', () => {
  expect(sniffMime(head('generated/not-an-image.jpg'))).toBeNull();
});

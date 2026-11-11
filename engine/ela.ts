/**
 * Error level analysis (ELA): re-saves the image as JPEG and shows where it
 * differs from the original, brightened. It is a visual aid only. It cannot
 * tell whether an image is AI-generated, and it is easy to misread, so it is
 * never turned into a verdict.
 */
const QUALITY = 0.9;
const AMPLIFY = 20;
const MAX_SIDE = 1600;

async function toImageData(blob: Blob, maxSide: number) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return { canvas: c, ctx, w, h, data: ctx.getImageData(0, 0, w, h) };
}

export async function errorLevelAnalysis(blob: Blob): Promise<{ png: string; width: number; height: number; quality: number; amplify: number }> {
  const orig = await toImageData(blob, MAX_SIDE);
  const recompressed = await orig.canvas.convertToBlob({ type: 'image/jpeg', quality: QUALITY });
  const again = await toImageData(recompressed, MAX_SIDE);
  const out = new ImageData(orig.w, orig.h);
  const a = orig.data.data;
  const b = again.data.data;
  for (let i = 0; i < a.length; i += 4) {
    out.data[i] = Math.min(255, Math.abs(a[i] - b[i]) * AMPLIFY);
    out.data[i + 1] = Math.min(255, Math.abs(a[i + 1] - b[i + 1]) * AMPLIFY);
    out.data[i + 2] = Math.min(255, Math.abs(a[i + 2] - b[i + 2]) * AMPLIFY);
    out.data[i + 3] = 255;
  }
  const c = new OffscreenCanvas(orig.w, orig.h);
  c.getContext('2d')!.putImageData(out, 0, 0);
  const png = await c.convertToBlob({ type: 'image/png' });
  const buf = new Uint8Array(await png.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 0x8000)));
  return { png: 'data:image/png;base64,' + btoa(s), width: orig.w, height: orig.h, quality: QUALITY, amplify: AMPLIFY };
}

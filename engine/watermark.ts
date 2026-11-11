/**
 * VERITAS on-device TrustMark watermark reader.
 *
 * Adapted from Adobe's TrustMark JavaScript decoder (MIT,
 * https://github.com/adobe/trustmark/tree/main/js). Runs ONNX models with
 * onnxruntime-web (WebAssembly, single thread) inside the same kind of
 * sandboxed WebView/iframe as the credentials engine. The models are handed in
 * as bytes by the app; this page makes no network requests.
 *
 * Protocol (JSON strings):
 *   in : {type:'model', name, b64, done} … {type:'load'}
 *        {type:'begin', id, mime, size} | {type:'chunk', id, b64} | {type:'end', id}
 *   out: {type:'ready', info} | {type:'models_loaded', variants} | {type:'watermark', id, result} | {type:'error', id, code, message}
 */
import * as ort from 'onnxruntime-web/wasm';

declare const __ORT_WASM_B64__: string;
declare const __ORT_VERSION__: string;
// Globals from Adobe's vendored scripts (loaded before this bundle).
declare function DataLayer_Decode(bits: boolean[], ecc: unknown, variant: string): { valid: boolean; data_binary: string; schema: string; softBindingInfo: unknown };
declare const eccengine: unknown;

const w = window as any;
function send(msg: unknown) {
  const s = JSON.stringify(msg);
  if (w.ReactNativeWebView) w.ReactNativeWebView.postMessage(s);
  else if (w.parent && w.parent !== w) w.parent.postMessage(s, '*');
  if (typeof w.__veritasOut === 'function') w.__veritasOut(s);
}

const MODEL_CONFIGS = [
  { variant: 'Q', fname: 'decoder_Q', resolution: 256, squarecrop: false },
  { variant: 'P', fname: 'decoder_P', resolution: 224, squarecrop: true },
];
export const MODEL_FILES = ['decoder_Q.onnx', 'decoder_P.onnx', 'resizer.onnx'];

const info = { library: 'Adobe TrustMark (JS decoder)', runtime: `onnxruntime-web ${__ORT_VERSION__}`, variants: MODEL_CONFIGS.map((c) => c.variant) };

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(parts: Uint8Array[]) {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmBinary = b64ToBytes(__ORT_WASM_B64__).buffer as ArrayBuffer;

const modelParts = new Map<string, Uint8Array[]>();
const models = new Map<string, Uint8Array>();
const sessions = new Map<string, ort.InferenceSession>();
let resizer: ort.InferenceSession | null = null;

async function loadModels() {
  for (const c of MODEL_CONFIGS) {
    const bytes = models.get(`${c.fname}.onnx`);
    if (bytes && !sessions.has(c.variant)) sessions.set(c.variant, await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] }));
  }
  const r = models.get('resizer.onnx');
  if (r && !resizer) resizer = await ort.InferenceSession.create(r, { executionProviders: ['wasm'] });
  models.clear();
  if (!resizer || !sessions.size) throw new Error('Watermark models missing');
  return [...sessions.keys()];
}

const MAX_SIDE = 1024;

async function imageTensor(blob: Blob) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const width = Math.max(1, Math.round(bmp.width * scale));
  const height = Math.max(1, Math.round(bmp.height * scale));
  const c = new OffscreenCanvas(width, height);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, width, height);
  const page = width * height;
  const t = new Float32Array(page * 3);
  for (let i = 0; i < page; i++) {
    t[i] = data[i * 4] / 255;
    t[i + page] = data[i * 4 + 1] / 255;
    t[i + 2 * page] = data[i * 4 + 2] / 255;
  }
  return new ort.Tensor('float32', t, [1, 3, height, width]);
}

function computeScale(original: number, target: number) {
  let lo = target / original;
  let hi = (target + 1) / original;
  let scale = lo;
  for (let i = 0; i < 100; i++) {
    scale = (lo + hi) / 2;
    const adjusted = Math.floor(original * scale + 1e-12);
    if (adjusted < target) lo = scale;
    else if (adjusted > target) hi = scale;
    else break;
  }
  return scale;
}

function crop(t: ort.Tensor, x0: number, y0: number, cw: number, ch: number) {
  const [b, c, h, w2] = t.dims as number[];
  const src = t.data as Float32Array;
  const out = new Float32Array(b * c * cw * ch);
  let k = 0;
  for (let ci = 0; ci < c; ci++) for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[k++] = src[ci * w2 * h + (y + y0) * w2 + (x + x0)];
  return new ort.Tensor('float32', out, [b, c, ch, cw]);
}

async function resizeSquare(input: ort.Tensor, target: number, forceSquare: boolean) {
  const [batch, channels, height, width] = input.dims as number[];
  const aspect = width / height;
  const landscape = aspect >= 1;
  let t = input;
  let cw = width;
  let ch = height;
  if (landscape && (aspect > 2 || forceSquare)) {
    cw = height;
    t = crop(input, Math.floor((width - cw) / 2), 0, cw, height);
  }
  if (!landscape && (aspect < 0.5 || forceSquare)) {
    ch = width;
    t = crop(input, 0, Math.floor((height - ch) / 2), width, ch);
  }
  void batch;
  void channels;
  const scales = new ort.Tensor('float32', new Float32Array([1, 1, computeScale(ch, target), computeScale(cw, target)]), [4]);
  const size = new ort.Tensor('int64', new BigInt64Array([BigInt(target)]), [1]);
  const r = await resizer!.run({ X: t, scales, target_size: size });
  return r['Y'];
}

async function decode(blob: Blob) {
  const input = await imageTensor(blob);
  const tried: string[] = [];
  for (const c of MODEL_CONFIGS) {
    const s = sessions.get(c.variant);
    if (!s) continue;
    tried.push(c.variant);
    const resized = await resizeSquare(input, c.resolution, c.squarecrop);
    const out = await s.run({ image: resized });
    const floats = out['output'].data as Float32Array;
    const bits = Array.from(floats, (v) => v >= 0);
    // A constant bit pattern is a valid all-zero codeword but not a real watermark.
    if (bits.every((b) => b === bits[0])) continue;
    const d = DataLayer_Decode(bits, eccengine, c.variant);
    if (d.valid) return { present: true as const, variant: c.variant, schema: d.schema, payload: d.data_binary, softBinding: d.softBindingInfo, tried };
  }
  return { present: false as const, tried };
}

const jobs = new Map<string, { mime: string; size: number; parts: Uint8Array[]; received: number }>();

async function receive(raw: string) {
  let msg: any;
  try {
    msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return;
  }
  try {
    if (msg.type === 'model') {
      const parts = modelParts.get(msg.name) ?? [];
      if (msg.b64) parts.push(b64ToBytes(msg.b64));
      modelParts.set(msg.name, parts);
      if (msg.done) {
        models.set(msg.name, concat(parts));
        modelParts.delete(msg.name);
      }
    } else if (msg.type === 'load') {
      send({ type: 'models_loaded', variants: await loadModels() });
    } else if (msg.type === 'begin') {
      jobs.set(msg.id, { mime: msg.mime, size: msg.size, parts: [], received: 0 });
    } else if (msg.type === 'chunk') {
      const j = jobs.get(msg.id);
      if (!j) return;
      const b = b64ToBytes(msg.b64);
      j.parts.push(b);
      j.received += b.length;
    } else if (msg.type === 'end') {
      const j = jobs.get(msg.id);
      jobs.delete(msg.id);
      if (!j || j.received !== j.size) return send({ type: 'error', id: msg.id, code: 'incomplete', message: 'File incomplete' });
      if (!resizer) return send({ type: 'error', id: msg.id, code: 'models_not_loaded', message: 'Models not loaded' });
      const result = await decode(new Blob(j.parts as BlobPart[], { type: j.mime }));
      send({ type: 'watermark', id: msg.id, result });
    }
  } catch (e: any) {
    send({ type: 'error', id: msg?.id ?? '', code: msg?.type === 'load' ? 'models_failed' : 'decode_failed', message: String(e?.message ?? e) });
  }
}

w.__veritas = { receive };
window.addEventListener('message', (e) => {
  if (typeof e.data === 'string' && e.data.includes('"type"')) void receive(e.data);
});
document.addEventListener('message' as any, (e: any) => void receive(e.data));
send({ type: 'ready', info });

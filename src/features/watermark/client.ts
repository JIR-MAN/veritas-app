/**
 * App-side client for the on-device TrustMark reader. The reader page runs in a
 * hidden WebView (native) or sandboxed iframe (web) mounted by WatermarkHost
 * only while the watermark screen is open.
 */
import { forEachChunk, toBase64 } from '@/features/evidence/fileio';
import { MAX_CHECK_BYTES, type PickedFile } from '@/features/check/engine-protocol';
import { MODEL_FILES } from './models-common';
import { readModel } from './models';

export type WatermarkResult =
  | { present: true; variant: string; schema: string; payload: string; softBinding: unknown; tried: string[] }
  | { present: false; tried: string[] };

export type WatermarkResponse = { type: 'watermark'; id: string; result: WatermarkResult } | { type: 'error'; id: string; code: string; message: string };

type Transport = (msg: string) => void;
let transport: Transport | null = null;
let ready = false;
let loaded = false;
const waiters: ((ok: boolean) => void)[] = [];
const pending = new Map<string, (m: any) => void>();
let seq = 0;

export const watermarkClient = {
  attach(t: Transport) {
    transport = t;
  },
  detach() {
    transport = null;
    ready = false;
    loaded = false;
    waiters.splice(0).forEach((w) => w(false));
    pending.forEach((r, id) => r({ type: 'error', id, code: 'closed', message: 'Reader closed' }));
    pending.clear();
  },
  receive(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      ready = true;
      waiters.splice(0).forEach((w) => w(true));
    } else if (msg.type === 'models_loaded' || (msg.type === 'error' && msg.code === 'models_failed')) {
      pending.get('__load')?.(msg);
      pending.delete('__load');
    } else if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg);
      pending.delete(msg.id);
    }
  },
  failed() {
    waiters.splice(0).forEach((w) => w(false));
  },
};

function waitReady(ms = 60000) {
  if (ready) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    waiters.push((ok) => {
      clearTimeout(t);
      resolve(ok);
    });
  });
}

function request<T>(key: string, ms: number): Promise<T> {
  return new Promise<T>((resolve) => {
    pending.set(key, resolve);
    setTimeout(() => {
      if (pending.has(key)) {
        pending.delete(key);
        resolve({ type: 'error', id: key, code: 'timeout', message: 'The reader took too long.' } as T);
      }
    }, ms);
  });
}

async function ensureModels(send: Transport): Promise<string | null> {
  if (loaded) return null;
  for (const name of MODEL_FILES) {
    await readModel(name, (bytes) => send(JSON.stringify({ type: 'model', name, b64: toBase64(bytes) })));
    send(JSON.stringify({ type: 'model', name, done: true }));
  }
  const res = request<any>('__load', 120000);
  send(JSON.stringify({ type: 'load' }));
  const r = await res;
  if (r.type !== 'models_loaded') return r.message ?? 'The reader could not start.';
  loaded = true;
  return null;
}

/** Looks for an Adobe TrustMark watermark in an image, on this device. Never invents a result. */
export async function readWatermark(file: PickedFile, mime: string): Promise<WatermarkResponse> {
  const id = `wm${++seq}`;
  const fail = (code: string, message: string): WatermarkResponse => ({ type: 'error', id, code, message });
  if (file.size > MAX_CHECK_BYTES) return fail('too_large', 'File exceeds on-device limit');
  if (!(await waitReady()) || !transport) return fail('reader_unavailable', 'The watermark reader did not start.');
  const send = transport;
  const loadError = await ensureModels(send);
  if (loadError) return fail('models_failed', loadError);
  const done = request<WatermarkResponse>(id, 120000);
  send(JSON.stringify({ type: 'begin', id, mime, size: file.size }));
  await forEachChunk(file, (bytes) => send(JSON.stringify({ type: 'chunk', id, b64: toBase64(bytes) })));
  send(JSON.stringify({ type: 'end', id }));
  return done;
}

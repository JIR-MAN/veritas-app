/**
 * App-side client for the on-device Content Credentials engine. The host
 * component (WebView on native, iframe on web) registers a transport here.
 */
import type { EngineInfo, EngineResponse } from './classify';
import { forEachChunk, toBase64 } from '@/features/evidence/fileio';
import { MAX_CHECK_BYTES, type PickedFile } from './engine-protocol';

type Transport = (msg: string) => void;
type Status = 'loading' | 'ready' | 'failed';

let transport: Transport | null = null;
let status: Status = 'loading';
let info: EngineInfo | null = null;
let initError: string | null = null;
const waiters: (() => void)[] = [];
const pending = new Map<string, (r: any) => void>();
const statusListeners = new Set<() => void>();
let seq = 0;

function setStatus(s: Status) {
  status = s;
  statusListeners.forEach((l) => l());
  if (s !== 'loading') waiters.splice(0).forEach((w) => w());
}

export const engineClient = {
  attach(t: Transport) {
    transport = t;
  },
  detach() {
    transport = null;
  },
  /** Called by the host with every message from the engine. */
  receive(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      info = msg.info;
      setStatus('ready');
    } else if (msg.type === 'error' && msg.code === 'init_failed') {
      initError = msg.message;
      setStatus('failed');
    } else if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg as EngineResponse);
      pending.delete(msg.id);
    }
  },
  failed(reason: string) {
    initError = reason;
    setStatus('failed');
  },
  status: () => status,
  info: () => info,
  initError: () => initError,
  onStatus(l: () => void) {
    statusListeners.add(l);
    return () => statusListeners.delete(l);
  },
};

function waitReady(timeoutMs = 30000) {
  if (status !== 'loading') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, timeoutMs);
    waiters.push(() => {
      clearTimeout(t);
      resolve();
    });
  });
}

/** Sends the file to the on-device engine and resolves with its raw response. Never invents a result. */
export async function runCredentialCheck(file: PickedFile, mime: string): Promise<EngineResponse> {
  return sendJob(file, mime, 'verify');
}

export type ElaResult = { type: 'ela'; id: string; ela: { png: string; width: number; height: number; quality: number; amplify: number } };

/** Error level analysis image, computed on the device. */
export async function runEla(file: PickedFile, mime: string): Promise<ElaResult | { type: 'error'; id: string; code: string; message: string }> {
  return sendJob(file, mime, 'ela');
}

async function sendJob(file: PickedFile, mime: string, op: 'verify' | 'ela'): Promise<any> {
  const id = `job${++seq}`;
  if (file.size > MAX_CHECK_BYTES) return { type: 'error', id, code: 'too_large', message: 'File exceeds on-device limit' };
  await waitReady();
  if (status !== 'ready' || !transport) {
    return { type: 'error', id, code: 'engine_unavailable', message: initError ?? 'Engine not available' };
  }
  const send = transport;
  const done = new Promise<EngineResponse>((resolve) => {
    pending.set(id, resolve);
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve({ type: 'error', id, code: 'timeout', message: 'The check took too long.' });
      }
    }, 120000);
  });
  send(JSON.stringify({ type: 'begin', id, mime, size: file.size, op }));
  // The engine compares received bytes with the declared size and reports any mismatch.
  await forEachChunk(file, (bytes) => {
    send(JSON.stringify({ type: 'chunk', id, b64: toBase64(bytes) }));
  });
  send(JSON.stringify({ type: 'end', id }));
  return done;
}

/**
 * VERITAS on-device Content Credentials engine.
 *
 * Runs the official CAI library (@contentauth/c2pa-web, a WebAssembly build of
 * c2pa-rs) inside a sandboxed WebView (native) or iframe (web). Media bytes are
 * sent in from the app and never leave the device: remote manifest fetching and
 * OCSP are disabled.
 *
 * Protocol (JSON strings):
 *   in : {type:'begin', id, mime, size} | {type:'chunk', id, b64} | {type:'end', id}
 *   out: {type:'ready', info} | {type:'result', id, report} | {type:'error', id, code, message}
 */
import { createC2pa, Reader } from '@contentauth/c2pa-web/inline';
import { Context } from '@contentauth/c2pa-utilities';
import c2paTrustList from '../assets/trust/c2pa-trust-list.pem';
import c2paTsaList from '../assets/trust/c2pa-tsa-trust-list.pem';
import interimAnchors from '../assets/trust/cai-interim-anchors.pem';
import interimAllowed from '../assets/trust/cai-interim-allowed.pem';
import interimStore from '../assets/trust/cai-interim-store.cfg';
import pkg from '@contentauth/c2pa-web/package.json';

declare const __TRUST_LISTS_FETCHED__: string;
declare const __EXTRA_USER_ANCHORS__: string;

type Inbound =
  | { type: 'begin'; id: string; mime: string; size: number }
  | { type: 'chunk'; id: string; b64: string }
  | { type: 'end'; id: string };

const w = window as any;

function send(msg: unknown) {
  const s = JSON.stringify(msg);
  if (w.ReactNativeWebView) w.ReactNativeWebView.postMessage(s);
  else if (w.parent && w.parent !== w) w.parent.postMessage(s, '*');
  // Test harness hook
  if (typeof w.__veritasOut === 'function') w.__veritasOut(s);
}

const info = {
  library: '@contentauth/c2pa-web',
  libraryVersion: (pkg as { version: string }).version,
  trustListsFetched: __TRUST_LISTS_FETCHED__,
  trustLists: ['C2PA Conformance Trust List', 'C2PA TSA Trust List', 'CAI interim trust list (legacy)'],
  testAnchorsLoaded: __EXTRA_USER_ANCHORS__.length > 0,
};

const settings = {
  verify: {
    verifyTrust: true,
    verifyAfterReading: true,
    verifyTimestampTrust: true,
    ocspFetch: false,
    remoteManifestFetch: false,
  },
  trust: {
    trustAnchors: c2paTrustList + '\n' + c2paTsaList,
    // "User" anchors: the CAI's legacy interim list (and, in test builds only, the c2pa-rs test CA).
    userAnchors: interimAnchors + (__EXTRA_USER_ANCHORS__ ? '\n' + __EXTRA_USER_ANCHORS__ : ''),
    allowedList: interimAllowed,
    trustConfig: interimStore,
  },
};

let c2paPromise: ReturnType<typeof createC2pa> | null = null;
let context: Context | null = null;
function getC2pa() {
  if (!c2paPromise) {
    c2paPromise = createC2pa();
    context = new Context(settings as any);
  }
  return c2paPromise;
}

const MAX_BYTES = 200 * 1024 * 1024;
const pending = new Map<string, { mime: string; size: number; parts: Uint8Array[]; received: number }>();

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verify(id: string) {
  const job = pending.get(id);
  pending.delete(id);
  if (!job) return send({ type: 'error', id, code: 'unknown_job', message: 'No data received.' });
  if (job.received !== job.size)
    return send({ type: 'error', id, code: 'incomplete', message: `Received ${job.received} of ${job.size} bytes.` });
  const started = Date.now();
  try {
    const c2pa = await getC2pa();
    const blob = new Blob(job.parts as BlobPart[], { type: job.mime });
    let reader: Awaited<ReturnType<typeof Reader.fromBlob>> = null;
    try {
      reader = await Reader.fromBlob(c2pa, job.mime, blob, context!);
    } catch (e: any) {
      const message = String(e?.message ?? e);
      // Credentials stored online rather than in the file. We do not fetch them
      // automatically: that would tell a third party which file is being checked.
      const remote = /RemoteManifestUrl\("([^"]+)"\)/.exec(message);
      if (remote) {
        return send({ type: 'result', id, report: { hasManifest: false, remoteManifestUrl: remote[1], engine: info, ms: Date.now() - started } });
      }
      // c2pa-rs reports "no manifest found" as an error for some formats.
      if (/JumbfNotFound|ManifestNotFound|no.*manifest|not found/i.test(message)) {
        return send({ type: 'result', id, report: { hasManifest: false, engine: info, ms: Date.now() - started } });
      }
      if (/UnsupportedType|unsupported/i.test(message)) {
        return send({ type: 'error', id, code: 'unsupported', message });
      }
      return send({ type: 'error', id, code: 'read_failed', message });
    }
    if (!reader) {
      return send({ type: 'result', id, report: { hasManifest: false, engine: info, ms: Date.now() - started } });
    }
    const store = await reader.manifestStore();
    const activeLabel = await reader.activeLabel();
    await reader.free();
    send({ type: 'result', id, report: { hasManifest: true, activeLabel, store, engine: info, ms: Date.now() - started } });
  } catch (e: any) {
    send({ type: 'error', id, code: 'engine_failed', message: String(e?.message ?? e) });
  }
}

function receive(raw: string | Inbound) {
  let msg: Inbound;
  try {
    msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return;
  }
  if (msg.type === 'begin') {
    if (msg.size > MAX_BYTES) return send({ type: 'error', id: msg.id, code: 'too_large', message: 'File too large.' });
    pending.set(msg.id, { mime: msg.mime, size: msg.size, parts: [], received: 0 });
  } else if (msg.type === 'chunk') {
    const job = pending.get(msg.id);
    if (!job) return;
    const bytes = b64ToBytes(msg.b64);
    job.parts.push(bytes);
    job.received += bytes.length;
    if (job.received > MAX_BYTES) {
      pending.delete(msg.id);
      send({ type: 'error', id: msg.id, code: 'too_large', message: 'File too large.' });
    }
  } else if (msg.type === 'end') {
    void verify(msg.id);
  }
}

w.__veritas = { receive };
window.addEventListener('message', (e) => {
  if (typeof e.data === 'string' && e.data.includes('"type"')) receive(e.data);
});
document.addEventListener('message' as any, (e: any) => receive(e.data)); // Android legacy

getC2pa()
  .then(() => send({ type: 'ready', info }))
  .catch((e) => send({ type: 'error', id: '', code: 'init_failed', message: String(e?.message ?? e) }));

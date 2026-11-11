/** Web: the TrustMark reader models are kept in this browser's Cache Storage. */
import { CHUNK_BYTES } from '@/features/check/engine-protocol';
import { MODEL_BASE_URL, MODEL_FILES, MODEL_SHA256, sha256Hex, type ModelName } from './models-common';

const CACHE = 'veritas-trustmark-v1';
const open = () => caches.open(CACHE);

export async function modelsReady(): Promise<boolean> {
  try {
    const c = await open();
    for (const n of MODEL_FILES) if (!(await c.match(MODEL_BASE_URL + n))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function modelsBytes(): Promise<number> {
  try {
    const c = await open();
    let total = 0;
    for (const n of MODEL_FILES) {
      const r = await c.match(MODEL_BASE_URL + n);
      if (r) total += (await r.blob()).size;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function downloadModels(onProgress: (doneFiles: number, total: number) => void) {
  const c = await open();
  let i = 0;
  for (const n of MODEL_FILES) {
    onProgress(i, MODEL_FILES.length);
    const res = await fetch(MODEL_BASE_URL + n, { credentials: 'omit' });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const want = MODEL_SHA256[n];
    if (want && (await sha256Hex(bytes)) !== want) throw new Error(`${n} did not match its expected fingerprint`);
    await c.put(MODEL_BASE_URL + n, new Response(bytes as BodyInit));
    i++;
  }
  onProgress(i, MODEL_FILES.length);
}

export async function readModel(name: ModelName, cb: (bytes: Uint8Array) => void) {
  const r = await (await open()).match(MODEL_BASE_URL + name);
  if (!r) throw new Error('Model missing');
  const b = await r.blob();
  for (let i = 0; i < b.size; i += CHUNK_BYTES) cb(new Uint8Array(await b.slice(i, i + CHUNK_BYTES).arrayBuffer()));
}

export async function deleteModels() {
  try {
    await caches.delete(CACHE);
  } catch {
    // nothing stored
  }
}

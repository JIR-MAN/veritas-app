/** Native storage for the TrustMark reader models, kept in the app's private documents folder. */
import { Directory, File, Paths } from 'expo-file-system';
import { forEachChunk } from '@/features/evidence/fileio';
import { MODEL_BASE_URL, MODEL_FILES, MODEL_SHA256, type ModelName } from './models-common';

const dir = () => new Directory(Paths.document, 'trustmark');
const fileOf = (name: ModelName) => new File(dir(), name);

export async function modelsReady(): Promise<boolean> {
  return MODEL_FILES.every((n) => {
    const f = fileOf(n);
    return f.exists && f.size > 0;
  });
}

export async function modelsBytes(): Promise<number> {
  return MODEL_FILES.reduce((a, n) => a + (fileOf(n).exists ? fileOf(n).size : 0), 0);
}

export async function downloadModels(onProgress: (doneFiles: number, total: number) => void) {
  const d = dir();
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  let i = 0;
  for (const n of MODEL_FILES) {
    onProgress(i, MODEL_FILES.length);
    const f = fileOf(n);
    if (f.exists) f.delete();
    try {
      await File.downloadFileAsync(MODEL_BASE_URL + n, f);
      const want = MODEL_SHA256[n];
      if (want && (await f.digest('SHA-256')).toLowerCase() !== want) throw new Error(`${n} did not match its expected fingerprint`);
    } catch (e) {
      if (f.exists) f.delete();
      throw e;
    }
    i++;
  }
  onProgress(i, MODEL_FILES.length);
}

export async function readModel(name: ModelName, cb: (bytes: Uint8Array) => void) {
  const f = fileOf(name);
  await forEachChunk({ uri: f.uri, name, mimeType: 'application/octet-stream', size: f.size }, cb);
}

export async function deleteModels() {
  const d = dir();
  if (d.exists) d.delete();
}

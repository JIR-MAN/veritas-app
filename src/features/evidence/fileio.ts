/** Native file access. All processing happens on the device. */
import { Asset } from 'expo-asset';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { CHUNK_BYTES, sniffMime, type PickedFile } from '@/features/check/engine-protocol';
import { SAMPLES, type SampleKey } from './samples';

export async function pickFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const f = new File(a.uri);
  return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', size: f.size || a.size || 0, lastModified: a.lastModified ?? null };
}

export async function loadSample(key: SampleKey): Promise<PickedFile> {
  const s = SAMPLES.find((x) => x.key === key)!;
  const asset = Asset.fromModule(s.module);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const f = new File(uri);
  return { uri, name: s.name, mimeType: 'image/jpeg', size: f.size, lastModified: null, isSample: true };
}

export async function readHead(file: PickedFile, n = 32): Promise<Uint8Array> {
  const h = new File(file.uri).open();
  try {
    return h.readBytesSync(Math.min(n, file.size));
  } finally {
    h.close();
  }
}

export async function forEachChunk(file: PickedFile, cb: (bytes: Uint8Array) => Promise<void> | void) {
  const h = new File(file.uri).open();
  try {
    let remaining = h.size ?? file.size;
    while (remaining > 0) {
      const bytes = await h.readBytes(Math.min(CHUNK_BYTES, remaining));
      if (!bytes.length) break;
      remaining -= bytes.length;
      await cb(bytes);
    }
  } finally {
    h.close();
  }
}

/** SHA-256 computed natively by streaming the file; returns lowercase hex. */
export async function sha256(file: PickedFile): Promise<string> {
  return (await new File(file.uri).digest('SHA-256')).toLowerCase();
}

export async function realMime(file: PickedFile): Promise<string> {
  const sniffed = sniffMime(await readHead(file));
  return sniffed ?? file.mimeType;
}

function evidenceDir() {
  const d = new Directory(Paths.document, 'evidence');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

/** Copies the original into the app's private storage so the record survives the picker cache being cleared. */
export async function keepCopy(file: PickedFile, id: string): Promise<string> {
  const ext = (file.name.match(/\.[A-Za-z0-9]{1,6}$/)?.[0] ?? '').toLowerCase();
  const dest = new File(evidenceDir(), `${id}${ext}`);
  if (dest.exists) dest.delete();
  await new File(file.uri).copy(dest);
  return dest.uri;
}

export function deleteStored(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}

export function deleteAllStored() {
  try {
    const d = new Directory(Paths.document, 'evidence');
    if (d.exists) d.delete();
  } catch {}
}

export function fileExists(uri: string | null) {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  }
  return btoa(s);
}

export const storageNote = 'Files are kept in VERITAS’s private storage on this device.';

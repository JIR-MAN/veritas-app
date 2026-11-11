/** Web demo file access. Files stay in this browser tab; nothing is uploaded. */
import { Asset } from 'expo-asset';
import * as DocumentPicker from 'expo-document-picker';
import { CHUNK_BYTES, sniffMime, type PickedFile } from '@/features/check/engine-protocol';
import { SAMPLES, type SampleKey } from './samples';

const blobs = new Map<string, Blob>();

async function blobOf(file: PickedFile): Promise<Blob> {
  if (file.webFile) return file.webFile;
  const cached = blobs.get(file.uri);
  if (cached) return cached;
  const b = await (await fetch(file.uri)).blob();
  blobs.set(file.uri, b);
  return b;
}

export async function pickFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'video/*', 'audio/*', 'application/pdf'], multiple: false });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType || a.file?.type || 'application/octet-stream', size: a.size ?? a.file?.size ?? 0, lastModified: a.lastModified ?? null, webFile: a.file };
}

export async function loadSample(key: SampleKey): Promise<PickedFile> {
  const s = SAMPLES.find((x) => x.key === key)!;
  const asset = Asset.fromModule(s.module);
  const blob = await (await fetch(asset.uri)).blob();
  const uri = URL.createObjectURL(blob);
  blobs.set(uri, blob);
  return { uri, name: s.name, mimeType: 'image/jpeg', size: blob.size, lastModified: null, webFile: blob, isSample: true };
}

export async function readHead(file: PickedFile, n = 32) {
  return new Uint8Array(await (await blobOf(file)).slice(0, n).arrayBuffer());
}

export async function forEachChunk(file: PickedFile, cb: (bytes: Uint8Array) => Promise<void> | void) {
  const b = await blobOf(file);
  for (let i = 0; i < b.size; i += CHUNK_BYTES) await cb(new Uint8Array(await b.slice(i, i + CHUNK_BYTES).arrayBuffer()));
}

export async function sha256(file: PickedFile) {
  const buf = await (await blobOf(file)).arrayBuffer();
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d, (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function realMime(file: PickedFile) {
  return sniffMime(await readHead(file)) ?? file.mimeType;
}

export async function keepCopy(file: PickedFile, _id: string) {
  const b = await blobOf(file);
  const uri = URL.createObjectURL(b);
  blobs.set(uri, b);
  return uri;
}

export function deleteStored(uri: string | null | undefined) {
  if (!uri) return;
  blobs.delete(uri);
  try {
    URL.revokeObjectURL(uri);
  } catch {}
}
export function deleteAllStored() {
  blobs.clear();
}
export function fileExists(uri: string | null) {
  return !!uri && blobs.has(uri);
}
export function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  return btoa(s);
}
export const storageNote = 'Web demo: files are held in this browser tab only and are gone after you close it.';

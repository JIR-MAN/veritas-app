/**
 * Holds in-progress checks in memory only. A checked file is not saved
 * anywhere unless the user chooses "Save as evidence".
 */
import { useSyncExternalStore } from 'react';
import { classify, type Classification } from './classify';
import { runCredentialCheck } from './engine-client';
import { SUPPORTED_MIME, type PickedFile } from './engine-protocol';
import { realMime } from '@/features/evidence/fileio';

export type CheckSession = {
  id: string;
  file: PickedFile;
  declaredMime: string;
  detectedMime: string;
  mimeMismatch: boolean;
  status: 'running' | 'done';
  result: Classification | null;
  startedAt: string;
  finishedAt: string | null;
  savedEvidenceId: string | null;
};

const sessions = new Map<string, CheckSession>();
const listeners = new Set<() => void>();
let n = 0;

function put(s: CheckSession) {
  sessions.set(s.id, s);
  listeners.forEach((l) => l());
}

export function getSession(id: string | undefined) {
  return id ? sessions.get(id) ?? null : null;
}

export function useCheckSession(id: string | undefined) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => getSession(id),
    () => getSession(id),
  );
}

export function markSaved(id: string, evidenceId: string) {
  const s = sessions.get(id);
  if (s) put({ ...s, savedEvidenceId: evidenceId });
}

/** Starts a check and returns its id immediately; the result screen follows progress. */
export function startCheck(file: PickedFile): string {
  const id = `chk${Date.now().toString(36)}${++n}`;
  const base: CheckSession = {
    id,
    file,
    declaredMime: file.mimeType,
    detectedMime: file.mimeType,
    mimeMismatch: false,
    status: 'running',
    result: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    savedEvidenceId: null,
  };
  put(base);
  (async () => {
    let detected = file.mimeType;
    try {
      detected = await realMime(file);
    } catch {}
    const known = SUPPORTED_MIME.includes(detected);
    const res = known
      ? await runCredentialCheck(file, detected)
      : ({ type: 'error', id, code: 'unsupported', message: `Detected type ${detected}` } as const);
    put({
      ...base,
      detectedMime: detected,
      mimeMismatch: !!file.mimeType && file.mimeType !== 'application/octet-stream' && detected !== file.mimeType && !(detected === 'audio/wav' && file.mimeType === 'audio/x-wav'),
      status: 'done',
      result: classify(res),
      finishedAt: new Date().toISOString(),
    });
  })().catch((e) => {
    put({ ...base, status: 'done', result: classify({ type: 'error', id, code: 'app_error', message: String(e) }), finishedAt: new Date().toISOString() });
  });
  return id;
}

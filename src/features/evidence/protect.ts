/** "Protect evidence": fingerprint a file and record it in a case, on this device only. */
import type { Classification } from '@/features/check/classify';
import type { PickedFile } from '@/features/check/engine-protocol';
import { cases } from '@/features/cases/store';
import type { Evidence } from '@/features/cases/model';
import { keepCopy, realMime, sha256 } from './fileio';

export function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function protectFile(opts: {
  file: PickedFile;
  caseId: string;
  sourceUrl?: string | null;
  check?: Classification | null;
  checkedAt?: string | null;
}): Promise<Evidence> {
  const { file, caseId } = opts;
  const [hash, mime] = await Promise.all([sha256(file), realMime(file)]);
  const hashedAt = new Date().toISOString();
  const tmpId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  let storedUri: string | null = null;
  try {
    storedUri = await keepCopy(file, tmpId);
  } catch {
    storedUri = null;
  }
  return cases.addEvidence({
    caseId,
    fileName: file.name,
    mimeType: mime,
    size: file.size,
    sha256: hash,
    storedUri,
    sourceUrl: opts.sourceUrl?.trim() || null,
    hashedAt,
    timeZone: deviceTimeZone(),
    fileModifiedAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    check: opts.check ?? null,
    checkedAt: opts.checkedAt ?? null,
    isSample: !!file.isSample,
  });
}

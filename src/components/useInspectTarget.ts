import { useLocalSearchParams } from 'expo-router';
import type { PickedFile } from '@/features/check/engine-protocol';
import { useCheckSession } from '@/features/check/session';
import { useData } from '@/features/cases/store';
import { fileExists } from '@/features/evidence/fileio';

/** Resolves the file being inspected, from an open check or a saved evidence record. */
export function useInspectTarget(): { file: PickedFile | null; mime: string; sourceUrl: string | null; missing: boolean } {
  const { check, evidence } = useLocalSearchParams<{ check?: string; evidence?: string }>();
  const s = useCheckSession(check);
  const ev = useData((d) => (evidence ? d.evidence.find((e) => e.id === evidence) : undefined));
  if (s) return { file: s.file, mime: s.detectedMime, sourceUrl: null, missing: false };
  if (ev && ev.storedUri && fileExists(ev.storedUri)) {
    return { file: { uri: ev.storedUri, name: ev.fileName, mimeType: ev.mimeType, size: ev.size, isSample: ev.isSample }, mime: ev.mimeType, sourceUrl: ev.sourceUrl, missing: false };
  }
  return { file: null, mime: '', sourceUrl: ev?.sourceUrl ?? null, missing: true };
}

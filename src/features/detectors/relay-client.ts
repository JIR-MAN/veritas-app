/**
 * Client for the VERITAS detection relay (server/detector-relay). Only used
 * after the user confirms. Provider results are shown as the provider's own
 * opinion, never as VERITAS's conclusion.
 */
import type { PickedFile } from '@/features/check/engine-protocol';
import { RELAY_URL, type DetectorService } from './services';

export type DetectorOpinion = {
  provider: DetectorService['id'];
  model: string;
  /** Provider's raw score in [0,1] for "AI-generated". Not a calibrated probability. */
  score: number;
  band: 'leans_ai' | 'uncertain' | 'leans_not_ai';
  checkedAt: string;
};

export function bandOf(score: number): DetectorOpinion['band'] {
  if (score >= 0.85) return 'leans_ai';
  if (score <= 0.15) return 'leans_not_ai';
  return 'uncertain';
}

export const BAND_TEXT: Record<DetectorOpinion['band'], string> = {
  leans_ai: 'Leans towards AI-generated',
  uncertain: 'Uncertain',
  leans_not_ai: 'Leans towards not AI-generated',
};

export async function askDetector(provider: DetectorService['id'], file: PickedFile, mime: string): Promise<DetectorOpinion> {
  if (!RELAY_URL) throw new Error('Detection relay is not configured.');
  const form = new FormData();
  if (file.webFile) form.append('media', file.webFile, file.name);
  else form.append('media', { uri: file.uri, name: file.name, type: mime } as unknown as Blob);
  const res = await fetch(`${RELAY_URL.replace(/\/$/, '')}/v1/detect?provider=${provider}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`The service answered ${res.status}.`);
  const j = await res.json();
  if (typeof j.score !== 'number' || j.score < 0 || j.score > 1) throw new Error('The service gave no usable answer.');
  return { provider, model: String(j.model ?? provider), score: j.score, band: bandOf(j.score), checkedAt: new Date().toISOString() };
}

/**
 * Local case store. Everything stays on this device. No network calls.
 * A tiny observable store so screens re-render on change.
 */
import { useSyncExternalStore } from 'react';
import { kv } from '@/features/store/kv';
import type { Case, DataState, Evidence, IssueCategory, TimelineEntry, TimelineKind } from './model';

const KEY = 'data.v1';

function newId(prefix: string) {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

function load(): DataState {
  try {
    const raw = kv.get(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DataState;
      if (parsed.version === 1) return parsed;
    }
  } catch {}
  return { version: 1, cases: [], evidence: [], timeline: [] };
}

let state: DataState | null = null;
const listeners = new Set<() => void>();

function get(): DataState {
  if (!state) state = load();
  return state;
}

function commit(next: DataState) {
  state = next;
  kv.set(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useData<T>(select: (s: DataState) => T): T {
  return useSyncExternalStore(subscribe, () => select(get()), () => select(get()));
}

const now = () => new Date().toISOString();

function touchCase(s: DataState, caseId: string, at: string): Case[] {
  return s.cases.map((c) => (c.id === caseId ? { ...c, updatedAt: at } : c));
}

function entry(caseId: string, kind: TimelineKind, text: string, extra: Partial<TimelineEntry> = {}): TimelineEntry {
  const t = now();
  return { id: newId('t'), caseId, kind, occurredAt: t, occurredApprox: false, recordedAt: t, text, ...extra };
}

export const cases = {
  getState: get,

  create(title: string, category: IssueCategory): Case {
    const t = now();
    const c: Case = { id: newId('c'), title: title.trim() || 'Untitled case', category, createdAt: t, updatedAt: t };
    const s = get();
    commit({ ...s, cases: [c, ...s.cases], timeline: [...s.timeline, entry(c.id, 'case_created', 'Case opened')] });
    return c;
  },

  rename(caseId: string, title: string) {
    const s = get();
    commit({ ...s, cases: s.cases.map((c) => (c.id === caseId ? { ...c, title: title.trim() || c.title, updatedAt: now() } : c)) });
  },

  addEvidence(e: Omit<Evidence, 'id'>): Evidence {
    const ev: Evidence = { ...e, id: newId('e') };
    const s = get();
    const log = entry(e.caseId, 'evidence_added', `Fingerprinted ${e.fileName}`, { evidenceId: ev.id });
    const logs = [log];
    if (e.check) logs.push(entry(e.caseId, 'check_run', `Content Credentials: ${e.check.headline}`, { evidenceId: ev.id }));
    commit({ ...s, evidence: [...s.evidence, ev], timeline: [...s.timeline, ...logs], cases: touchCase(s, e.caseId, log.recordedAt) });
    return ev;
  },

  updateEvidence(id: string, patch: Partial<Pick<Evidence, 'sourceUrl' | 'check' | 'checkedAt'>>) {
    const s = get();
    const ev = s.evidence.find((x) => x.id === id);
    if (!ev) return;
    const timeline = patch.check
      ? [...s.timeline, entry(ev.caseId, 'check_run', `Content Credentials: ${patch.check.headline}`, { evidenceId: id })]
      : s.timeline;
    commit({ ...s, evidence: s.evidence.map((x) => (x.id === id ? { ...x, ...patch } : x)), timeline, cases: touchCase(s, ev.caseId, now()) });
  },

  addNote(caseId: string, text: string, occurredAt: string, occurredApprox: boolean) {
    const s = get();
    const e = entry(caseId, 'note', text.trim(), { occurredAt, occurredApprox });
    commit({ ...s, timeline: [...s.timeline, e], cases: touchCase(s, caseId, e.recordedAt) });
  },

  deleteNote(entryId: string) {
    const s = get();
    commit({ ...s, timeline: s.timeline.filter((t) => !(t.id === entryId && t.kind === 'note')) });
  },

  logReport(caseId: string, text: string) {
    const s = get();
    commit({ ...s, timeline: [...s.timeline, entry(caseId, 'report_generated', text)] });
  },

  /** Removes the case, its notes and evidence records. Returns stored file URIs so the caller can delete them. */
  deleteCase(caseId: string): string[] {
    const s = get();
    const uris = s.evidence.filter((e) => e.caseId === caseId && e.storedUri).map((e) => e.storedUri!) as string[];
    commit({
      ...s,
      cases: s.cases.filter((c) => c.id !== caseId),
      evidence: s.evidence.filter((e) => e.caseId !== caseId),
      timeline: s.timeline.filter((t) => t.caseId !== caseId),
    });
    return uris;
  },

  deleteEvidence(id: string): string | null {
    const s = get();
    const ev = s.evidence.find((e) => e.id === id);
    if (!ev) return null;
    commit({
      ...s,
      evidence: s.evidence.filter((e) => e.id !== id),
      timeline: [
        ...s.timeline.filter((t) => t.evidenceId !== id || t.kind === 'evidence_added'),
        entry(ev.caseId, 'note', `Evidence record for ${ev.fileName} deleted by user`),
      ].map((t) => (t.evidenceId === id ? { ...t, evidenceId: undefined } : t)),
    });
    return ev.storedUri;
  },

  wipeAll() {
    commit({ version: 1, cases: [], evidence: [], timeline: [] });
  },

  /** For tests only. */
  __reset() {
    state = null;
  },
};

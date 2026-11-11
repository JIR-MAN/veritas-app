jest.mock('@/features/store/kv', () => {
  const m = new Map<string, string>();
  return { kv: { get: (k: string) => m.get(k) ?? null, set: (k: string, v: string) => m.set(k, v), remove: (k: string) => m.delete(k), clear: () => m.clear() } };
});
// eslint-disable-next-line import/first -- jest.mock must come first
import { cases } from '../store';

const base = {
  fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10, sha256: 'f'.repeat(64), storedUri: 'file:///a', sourceUrl: null,
  hashedAt: '2026-11-11T00:00:00.000Z', timeZone: 'UTC', fileModifiedAt: null, check: null, checkedAt: null, isSample: false,
};

beforeEach(() => {
  cases.wipeAll();
});

test('the action log distinguishes user notes from VERITAS records', () => {
  const c = cases.create('Test', 'scam');
  cases.addEvidence({ ...base, caseId: c.id });
  cases.addNote(c.id, 'Got a call', '2026-11-10T10:00:00.000Z', true);
  cases.logReport(c.id, 'PDF report generated (not sent to anyone by VERITAS)');
  const kinds = cases.getState().timeline.map((t) => t.kind);
  expect(kinds).toEqual(['case_created', 'evidence_added', 'note', 'report_generated']);
  expect(cases.getState().timeline.find((t) => t.kind === 'report_generated')!.text).toMatch(/not sent/);
});

test('deleting a case removes everything and returns file copies to delete', () => {
  const c = cases.create('Test', 'scam');
  cases.addEvidence({ ...base, caseId: c.id });
  const uris = cases.deleteCase(c.id);
  expect(uris).toEqual(['file:///a']);
  const s = cases.getState();
  expect(s.cases).toHaveLength(0);
  expect(s.evidence).toHaveLength(0);
  expect(s.timeline).toHaveLength(0);
});

test('deleting evidence leaves an honest trace in the timeline', () => {
  const c = cases.create('Test', 'other');
  const e = cases.addEvidence({ ...base, caseId: c.id });
  cases.deleteEvidence(e.id);
  expect(cases.getState().timeline.some((t) => /deleted by user/.test(t.text))).toBe(true);
});

import { buildReportData, reportHtml } from '../report';
import type { Case, Evidence, TimelineEntry } from '@/features/cases/model';
import { classify } from '@/features/check/classify';

const kase: Case = { id: 'c1', title: 'Fake <b>video</b>', category: 'deepfake', createdAt: '2026-11-10T09:00:00.000Z', updatedAt: '2026-11-10T09:00:00.000Z' };
const ev: Evidence = {
  id: 'e1', caseId: 'c1', fileName: 'clip.mp4', mimeType: 'video/mp4', size: 1234, sha256: 'a'.repeat(64), storedUri: null,
  sourceUrl: 'https://example.com/x', hashedAt: '2026-11-10T09:05:00.000Z', timeZone: 'Africa/Accra', fileModifiedAt: null,
  check: classify({ type: 'result', id: 'x', report: { hasManifest: false, engine: { library: 'c2pa-web', libraryVersion: '0', trustListsFetched: '2026-11-11', trustLists: [] } } }),
  checkedAt: '2026-11-10T09:05:01.000Z', isSample: false,
};
const tl: TimelineEntry[] = [
  { id: 't2', caseId: 'c1', kind: 'note', occurredAt: '2026-11-09T20:00:00.000Z', occurredApprox: true, recordedAt: '2026-11-10T09:06:00.000Z', text: 'First saw it <script>alert(1)</script>' },
  { id: 't1', caseId: 'c1', kind: 'case_created', occurredAt: '2026-11-10T09:00:00.000Z', occurredApprox: false, recordedAt: '2026-11-10T09:00:00.000Z', text: 'Case opened' },
];

test('report data records facts and sources', () => {
  const d = buildReportData(kase, [ev], tl, '2026-11-11T10:00:00.000Z');
  expect(d.evidence[0].sha256).toBe('a'.repeat(64));
  expect(d.evidence[0].deviceTimeZone).toBe('Africa/Accra');
  expect(d.evidence[0].contentCredentials?.verdict).toBe('no_credentials');
  expect(d.chronology.map((c) => c.source)).toEqual(['user', 'veritas']); // sorted by when it happened
  expect(d.chronology[0].approximate).toBe(true);
});

test('report never claims admissibility, and says it is not legal advice', () => {
  const html = reportHtml(buildReportData(kase, [ev], tl));
  expect(html).toMatch(/not legal advice/i);
  expect(html).toMatch(/does not certify admissibility/i);
  expect(html).not.toMatch(/is admissible|court[- ]ready|legally valid/i);
});

test('user text is escaped in the PDF', () => {
  const html = reportHtml(buildReportData(kase, [ev], tl));
  expect(html).not.toContain('<script>alert(1)</script>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<b>video</b>');
});

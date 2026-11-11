import type { Classification } from '@/features/check/classify';

export type IssueCategory =
  | 'impersonation'
  | 'deepfake'
  | 'intimate_image'
  | 'scam'
  | 'phishing'
  | 'harassment'
  | 'privacy'
  | 'other';

export const ISSUE_LABELS: Record<IssueCategory, string> = {
  impersonation: 'Impersonation',
  deepfake: 'Deepfake or altered media',
  intimate_image: 'Fake or shared intimate images',
  scam: 'Financial scam',
  phishing: 'Phishing',
  harassment: 'Harassment or threats',
  privacy: 'Privacy intrusion',
  other: 'Something else',
};

export type Evidence = {
  id: string;
  caseId: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  /** Private copy inside the app sandbox. Null on the web demo after reload. */
  storedUri: string | null;
  /** Where the user says they found it. Recorded exactly as typed. */
  sourceUrl: string | null;
  /** When VERITAS fingerprinted the file (ISO, UTC). */
  hashedAt: string;
  /** IANA time zone of the device at hashing time. */
  timeZone: string;
  /** File's own last-modified time if the OS reported one. */
  fileModifiedAt: string | null;
  check: Classification | null;
  checkedAt: string | null;
  isSample: boolean;
};

export type TimelineKind = 'note' | 'evidence_added' | 'check_run' | 'report_generated' | 'case_created';

export type TimelineEntry = {
  id: string;
  caseId: string;
  kind: TimelineKind;
  /** For notes: when the user says it happened (may be approximate). Otherwise equals recordedAt. */
  occurredAt: string;
  occurredApprox: boolean;
  /** When it was written into VERITAS. */
  recordedAt: string;
  text: string;
  evidenceId?: string;
};

export type Case = {
  id: string;
  title: string;
  category: IssueCategory;
  createdAt: string;
  updatedAt: string;
};

export type DataState = {
  version: 1;
  cases: Case[];
  evidence: Evidence[];
  timeline: TimelineEntry[];
};

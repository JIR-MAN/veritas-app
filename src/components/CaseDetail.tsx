import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ISSUE_LABELS, type TimelineEntry } from '@/features/cases/model';
import { cases, useData } from '@/features/cases/store';
import { runCredentialCheck } from '@/features/check/engine-client';
import { classify } from '@/features/check/classify';
import { deleteStored, pickFile, realMime } from '@/features/evidence/fileio';
import { protectFile } from '@/features/evidence/protect';
import { buildReportData } from '@/features/export/report';
import { exportJson, exportPdf } from '@/features/export/exportReport';
import { formatDate, formatDateTime } from '@/features/format';
import { SUPPORTED_MIME } from '@/features/check/engine-protocol';
import { Button, Empty, Group, Icon, Pill, Row, Text, space, useLayout, type IconName } from '@/ui';
import { confirm, notify } from './confirm';

const KIND_ICON: Record<TimelineEntry['kind'], IconName> = {
  note: 'edit-3',
  evidence_added: 'shield',
  check_run: 'award',
  report_generated: 'file-text',
  case_created: 'folder',
};

export function CaseDetail({ id, embedded }: { id: string; embedded?: boolean }) {
  const kase = useData((s) => s.cases.find((c) => c.id === id));
  const allEvidence = useData((s) => s.evidence);
  const allTimeline = useData((s) => s.timeline);
  const evidence = allEvidence.filter((e) => e.caseId === id);
  const timeline = allTimeline.filter((t) => t.caseId === id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const { isWide } = useLayout();

  if (!kase) {
    return <Empty icon="folder" title="Case not found" body="It may have been deleted." />;
  }

  async function addEvidence() {
    setAdding(true);
    try {
      const file = await pickFile();
      if (!file) return;
      const ev = await protectFile({ file, caseId: id });
      // Run the credentials check after saving so the fingerprint is recorded first.
      const mime = await realMime(file);
      const res = SUPPORTED_MIME.includes(mime) ? await runCredentialCheck(file, mime) : ({ type: 'error', id: 'x', code: 'unsupported', message: mime } as const);
      cases.updateEvidence(ev.id, { check: classify(res), checkedAt: new Date().toISOString() });
    } catch {
      notify('Couldn’t add the file', 'VERITAS could not read this file. Nothing was saved.');
    } finally {
      setAdding(false);
    }
  }

  async function doExport(kind: 'pdf' | 'json') {
    if (!kase) return;
    setExporting(kind);
    try {
      const data = buildReportData(kase, evidence, allTimeline.filter((t) => t.caseId === id));
      const r = kind === 'pdf' ? await exportPdf(data) : await exportJson(data);
      if (r === 'unavailable') notify('Sharing unavailable', 'This device has no app that can receive the file.');
      else cases.logReport(id, kind === 'pdf' ? 'PDF report generated (not sent to anyone by VERITAS)' : 'Data file generated (not sent to anyone by VERITAS)');
    } catch {
      notify('Export failed', 'The report could not be created. Please try again.');
    } finally {
      setExporting(null);
    }
  }

  async function remove() {
    if (!kase) return;
    const ok = await confirm('Delete this case?', 'Its notes, fingerprints and the private copies of its files will be removed from this device. This can’t be undone.');
    if (!ok) return;
    cases.deleteCase(id).forEach(deleteStored);
    if (!embedded) router.back();
  }

  const evidenceGroup = (
    <Group title={`Evidence (${evidence.length})`}>
      {evidence.length ? (
        evidence.map((e) => (
          <Row
            key={e.id}
            icon="file"
            title={e.fileName}
            subtitle={`${e.sha256.slice(0, 16)}… · ${e.check ? e.check.headline : 'Checking…'}`}
            onPress={() => router.push({ pathname: '/evidence/[id]', params: { id: e.id } })}
          />
        ))
      ) : (
        <View style={{ padding: space.lg }}>
          <Text variant="callout" color="textMuted">
            Add the files involved. Each gets a fingerprint so you can show later that it wasn’t changed.
          </Text>
        </View>
      )}
      <Row icon="plus" iconColor="accent" title={adding ? 'Fingerprinting…' : 'Add a file'} onPress={adding ? undefined : addEvidence} testID="add-evidence" />
    </Group>
  );

  const timelineGroup = (
    <Group title="Timeline">
      {timeline.map((t) => (
        <View key={t.id} style={{ flexDirection: 'row', gap: space.md, padding: space.lg }} accessible accessibilityLabel={`${formatDateTime(t.occurredAt)}${t.occurredApprox ? ', approximate' : ''}. ${t.kind === 'note' ? 'Your note' : 'Recorded by VERITAS'}: ${t.text}`}>
          <Icon name={KIND_ICON[t.kind]} size={18} color={t.kind === 'note' ? 'accent' : 'textFaint'} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout">{t.text}</Text>
            <Text variant="footnote" color="textMuted">
              {formatDateTime(t.occurredAt)}
              {t.occurredApprox ? ' (approx.)' : ''} · {t.kind === 'note' ? 'Your note' : 'Recorded by VERITAS'}
            </Text>
          </View>
        </View>
      ))}
      <Row icon="edit-3" iconColor="accent" title="Add what happened" onPress={() => router.push({ pathname: '/case/[id]/note', params: { id } })} testID="add-note" />
    </Group>
  );

  const exportGroup = (
    <Group title="Report" footer="Reports are created on this device. VERITAS doesn’t send them anywhere. You choose who to share them with.">
      <Row icon="file-text" title={exporting === 'pdf' ? 'Preparing PDF…' : 'Export PDF report'} onPress={exporting ? undefined : () => doExport('pdf')} testID="export-pdf" />
      <Row icon="code" title={exporting === 'json' ? 'Preparing…' : 'Export data (JSON)'} onPress={exporting ? undefined : () => doExport('json')} />
    </Group>
  );

  return (
    <View>
      <View style={{ marginBottom: space.xl, gap: space.xs }}>
        <Pill label={ISSUE_LABELS[kase.category]} tone="accent" />
        <Text variant={embedded ? 'title' : 'display'}>{kase.title}</Text>
        <Text variant="footnote" color="textMuted">
          Opened {formatDate(kase.createdAt)} · Stored only on this device
        </Text>
      </View>
      {isWide && embedded ? (
        <View style={{ flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            {evidenceGroup}
            {exportGroup}
          </View>
          <View style={{ flex: 1 }}>{timelineGroup}</View>
        </View>
      ) : (
        <>
          {evidenceGroup}
          {timelineGroup}
          {exportGroup}
        </>
      )}
      <Button label="Delete case" variant="danger" icon="trash-2" onPress={remove} />
    </View>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { ChecksGroup, DetailsGroup, LimitationsGroup, ResultBanner, VerifyTips } from '@/components/ResultSections';
import { notify } from '@/components/confirm';
import { ISSUE_LABELS } from '@/features/cases/model';
import { cases, useData } from '@/features/cases/store';
import { markSaved, useCheckSession } from '@/features/check/session';
import { protectFile } from '@/features/evidence/protect';
import { formatBytes } from '@/features/format';
import { Button, Empty, Field, Group, Row, Screen, Text, radius, space, useColors, useLayout } from '@/ui';

export default function CheckResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useCheckSession(id);
  const { isTablet } = useLayout();
  const c = useColors();
  const allCases = useData((d) => d.cases);
  const [choosing, setChoosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState('');

  if (!s) {
    return (
      <Screen title="Result">
        <Empty icon="clock" title="This check has ended" body="Checks are kept only while the app is open. Choose the file again to re-run it." action={<Button label="Check a file" onPress={() => router.replace('/check')} />} />
      </Screen>
    );
  }

  if (s.status === 'running' || !s.result) {
    return (
      <Screen title="Checking">
        <View style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xxxl }} accessible accessibilityLabel="Checking on this device" accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={c.accent} />
          <Text variant="headline">Checking on this device</Text>
          <Text variant="callout" color="textMuted" center>
            {s.file.name}
          </Text>
        </View>
      </Screen>
    );
  }

  const r = s.result;

  async function saveTo(caseId: string) {
    if (!s || saving) return;
    setSaving(true);
    try {
      const ev = await protectFile({ file: s.file, caseId, sourceUrl: url, check: r, checkedAt: s.finishedAt });
      markSaved(s.id, ev.id);
      setChoosing(false);
      router.push({ pathname: '/evidence/[id]', params: { id: ev.id } });
    } catch {
      notify('Couldn’t save', 'The file could not be fingerprinted. Nothing was saved.');
    } finally {
      setSaving(false);
    }
  }

  async function saveToNew() {
    const kase = cases.create(`Case ${new Date().toLocaleDateString()}`, r.verdict === 'ai_declared' ? 'deepfake' : 'other');
    await saveTo(kase.id);
  }

  const fileGroup = (
    <Group title="File">
      <Field label="Name" value={s.file.name} />
      <Field label="Type (detected from content)" value={`${s.detectedMime} · ${formatBytes(s.file.size)}`} />
      {s.mimeMismatch ? <Row icon="alert-triangle" iconColor="caution" title="Name and content don’t match" subtitle={`The file says ${s.declaredMime} but its content is ${s.detectedMime}.`} /> : null}
      {s.file.isSample ? <Row icon="info" iconColor="info" title="Bundled sample file" subtitle="Signed with a public test certificate." /> : null}
    </Group>
  );

  const saveBlock = s.savedEvidenceId ? (
    <Button label="View evidence record" icon="file-text" variant="secondary" onPress={() => router.push({ pathname: '/evidence/[id]', params: { id: s.savedEvidenceId! } })} />
  ) : choosing ? (
    <View style={{ gap: space.md }}>
      <Group title="Where you found it (optional)" footer="Recorded exactly as you type it.">
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://"
          placeholderTextColor={c.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel="Link where you found the file"
          style={{ color: c.text, fontSize: 16, padding: space.lg, minHeight: 48 }}
        />
      </Group>
      <Group title="Save to case">
        <Row icon="folder-plus" iconColor="accent" title="New case" onPress={saveToNew} testID="save-new-case" />
        {allCases.map((k) => (
          <Row key={k.id} icon="folder" title={k.title} subtitle={ISSUE_LABELS[k.category]} onPress={() => saveTo(k.id)} />
        ))}
      </Group>
      {saving ? <ActivityIndicator color={c.accent} /> : null}
      <Button label="Cancel" variant="quiet" onPress={() => setChoosing(false)} />
    </View>
  ) : (
    <View style={{ gap: space.sm }}>
      <Button label="Save as evidence" icon="shield" onPress={() => setChoosing(true)} testID="save-evidence" />
      <Text variant="footnote" color="textMuted" center>
        Creates a fingerprint and keeps a private copy on this device.
      </Text>
    </View>
  );

  if (isTablet) {
    return (
      <Screen title="Result" wide>
        <View style={{ flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' }}>
          <View style={{ flex: 5, gap: 0 }}>
            <ResultBanner r={r} />
            {fileGroup}
            <View style={{ padding: space.lg, borderRadius: radius.lg, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, marginBottom: space.xl }}>{saveBlock}</View>
          </View>
          <View style={{ flex: 6 }}>
            <ChecksGroup r={r} />
            <DetailsGroup r={r} />
            <LimitationsGroup r={r} />
            <VerifyTips />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Result" footer={choosing ? undefined : saveBlock}>
      <ResultBanner r={r} />
      <ChecksGroup r={r} />
      <DetailsGroup r={r} />
      {fileGroup}
      {choosing ? saveBlock : null}
      <LimitationsGroup r={r} />
      <VerifyTips />
    </Screen>
  );
}

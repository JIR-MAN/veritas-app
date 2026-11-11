import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { ChecksGroup, DetailsGroup, LimitationsGroup, MetadataGroup, MoreChecksGroup, ResultBanner } from '@/components/ResultSections';
import { confirm, notify } from '@/components/confirm';
import { cases, useData } from '@/features/cases/store';
import { deleteStored, fileExists } from '@/features/evidence/fileio';
import { formatBytes, formatDateTime, groupHash } from '@/features/format';
import { Button, Empty, Field, Group, Row, Screen, space, useColors, useLayout } from '@/ui';

export default function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = useData((s) => s.evidence.find((x) => x.id === id));
  const kase = useData((s) => (e ? s.cases.find((c) => c.id === e.caseId) : undefined));
  const c = useColors();
  const { isTablet } = useLayout();
  const [url, setUrl] = useState(e?.sourceUrl ?? '');

  if (!e) return <Screen title="Evidence record"><Empty icon="file" title="Record not found" body="It may have been deleted." /></Screen>;

  const hasCopy = fileExists(e.storedUri);

  async function share() {
    if (!e?.storedUri) return;
    if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) return notify('Sharing unavailable', 'This device can’t share the file.');
    await Sharing.shareAsync(e.storedUri, { mimeType: e.mimeType, dialogTitle: e.fileName });
  }

  async function remove() {
    if (!e) return;
    const ok = await confirm('Delete this record?', 'The fingerprint, check result and private copy will be removed. The timeline will note that you deleted it.');
    if (!ok) return;
    deleteStored(cases.deleteEvidence(e.id));
    router.back();
  }

  const record = (
    <Group title="Fingerprint" footer="SHA-256. Any change to the file, even one pixel, gives a completely different fingerprint.">
      <Field label="SHA-256" value={groupHash(e.sha256)} mono />
      <Field label="Fingerprinted" value={`${formatDateTime(e.hashedAt, e.timeZone)} · ${e.timeZone}`} />
      <Field label="File" value={`${e.fileName} · ${e.mimeType} · ${formatBytes(e.size)}`} />
      {e.fileModifiedAt ? <Field label="File last modified (reported by device)" value={formatDateTime(e.fileModifiedAt)} /> : null}
    </Group>
  );

  const source = (
    <Group title="Where you found it" footer="Recorded exactly as you type it.">
      <TextInput
        value={url}
        onChangeText={setUrl}
        onEndEditing={() => cases.updateEvidence(e.id, { sourceUrl: url.trim() || null })}
        onBlur={() => cases.updateEvidence(e.id, { sourceUrl: url.trim() || null })}
        placeholder="https://"
        placeholderTextColor={c.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Link where you found the file"
        style={{ color: c.text, fontSize: 16, padding: space.lg, minHeight: 48 }}
      />
    </Group>
  );

  const actions = (
    <Group title="File">
      {kase ? <Row icon="folder" title={kase.title} subtitle="Case" onPress={() => router.push({ pathname: '/case/[id]', params: { id: kase.id } })} /> : null}
      {hasCopy && Platform.OS !== 'web' ? <Row icon="share" title="Share original file" onPress={share} /> : null}
      {!hasCopy ? <Row icon="alert-circle" iconColor="caution" title="Private copy not available" subtitle={Platform.OS === 'web' ? 'The web demo keeps files only while the tab is open.' : 'The fingerprint record remains.'} /> : null}
    </Group>
  );

  const check = e.check ? (
    <>
      <ResultBanner r={e.check} />
      <ChecksGroup r={e.check} />
      <DetailsGroup r={e.check} />
      <MetadataGroup r={e.check} />
      {hasCopy ? <MoreChecksGroup target={{ evidence: e.id }} /> : null}
      <LimitationsGroup r={e.check} />
    </>
  ) : (
    <Group title="Content Credentials">
      <Row icon="loader" title="Not checked yet" subtitle="The check runs after the file is fingerprinted." />
    </Group>
  );

  return (
    <Screen title="Evidence record" wide={isTablet}>
      {isTablet ? (
        <View style={{ flexDirection: 'row', gap: space.xxl, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            {record}
            {source}
            {actions}
            <Button label="Delete record" variant="danger" icon="trash-2" onPress={remove} />
          </View>
          <View style={{ flex: 1 }}>{check}</View>
        </View>
      ) : (
        <>
          {record}
          {check}
          {source}
          {actions}
          <Button label="Delete record" variant="danger" icon="trash-2" onPress={remove} />
        </>
      )}
    </Screen>
  );
}

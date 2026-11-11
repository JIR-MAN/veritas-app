import { router } from 'expo-router';
import { View } from 'react-native';
import type { Classification } from '@/features/check/classify';
import { formatDateTime } from '@/features/format';
import { CheckRow, Field, Group, Row, Text, VerdictBanner, space } from '@/ui';

export function ResultBanner({ r }: { r: Classification }) {
  return <VerdictBanner tone={r.tone} headline={r.headline} summary={r.summary} />;
}

export function ChecksGroup({ r }: { r: Classification }) {
  return (
    <Group title="Checks" footer={r.engine ? `On-device engine: ${r.engine.library} ${r.engine.libraryVersion}. Trust lists from ${r.engine.trustListsFetched}.` : undefined}>
      {r.checks.map((c) => (
        <CheckRow key={c.id} line={c} />
      ))}
    </Group>
  );
}

export function DetailsGroup({ r }: { r: Classification }) {
  const rows = [
    r.originLabel ? <Field key="o" label="Declared origin" value={r.originLabel} /> : null,
    r.signer ? <Field key="s" label="Signed by" value={r.signer} /> : null,
    r.signedAt ? <Field key="t" label="Signed at (from the credential’s timestamp)" value={formatDateTime(r.signedAt)} /> : null,
    r.generator ? <Field key="g" label="Made with" value={r.generator} /> : null,
    r.failureCodes.length ? <Field key="f" label="Validation codes" value={r.failureCodes.join(', ')} mono /> : null,
  ].filter(Boolean);
  if (!rows.length) return null;
  return <Group title="What the credentials say">{rows}</Group>;
}

export function LimitationsGroup({ r }: { r: Classification }) {
  return (
    <Group title="Keep in mind">
      <View style={{ padding: space.lg, gap: space.sm }}>
        {r.limitations.map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
            <Text variant="callout" color="textMuted">
              •
            </Text>
            <Text variant="callout" color="textMuted" style={{ flex: 1 }}>
              {l}
            </Text>
          </View>
        ))}
      </View>
      <Row icon="book-open" title="How checks work" onPress={() => router.push('/about/checks')} />
    </Group>
  );
}

export function VerifyTips() {
  return (
    <Group title="Verify independently">
      <Row icon="phone" title="Contact the person another way" subtitle="Use a number or account you already trust, not one in the message." />
      <Row icon="link" title="Find the original source" subtitle="Look for the earliest copy and who first posted it." />
      <Row icon="eye" title="Compare with the original file" subtitle="If someone has the original, its fingerprint should match exactly." />
    </Group>
  );
}

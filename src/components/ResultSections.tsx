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

export function MetadataGroup({ r }: { r: Classification }) {
  const m = r.metadata;
  if (!m || (!m.findings.length && !m.fields.length)) return null;
  return (
    <Group title="What the file details say" footer="File details can be edited by anyone. Treat them as clues.">
      {m.findings.map((f, i) => (
        <Field key={`f${i}`} label={f.source} value={f.kind === 'ai_declared' ? `AI-generated (${f.value})` : f.kind === 'generator' ? `Mentions ${f.value}` : f.value} />
      ))}
      {m.fields.map((f, i) => (
        <Field key={`d${i}`} label={f.label} value={f.value} />
      ))}
    </Group>
  );
}

/** Other ways to check, each started only by the user. */
export function MoreChecksGroup({ target }: { target: { check?: string; evidence?: string } }) {
  return (
    <Group title="More ways to check" footer="Nothing leaves this device unless you choose a web service and confirm.">
      <Row icon="globe" title="Search the web and SynthID" subtitle="Find earlier copies, or check Google’s AI watermark" onPress={() => router.push({ pathname: '/inspect/search', params: target })} testID="more-search" />
      <Row icon="droplet" title="Invisible watermark" subtitle="Read Adobe’s TrustMark on this device (free)" onPress={() => router.push({ pathname: '/inspect/watermark', params: target })} testID="more-watermark" />
      <Row icon="layers" title="Error levels" subtitle="An advanced visual aid on this device" onPress={() => router.push({ pathname: '/inspect/ela', params: target })} testID="more-ela" />
      <Row icon="cpu" title="AI detection services" subtitle="Paid services: see what’s available" onPress={() => router.push({ pathname: '/inspect/detectors', params: target })} testID="more-detectors" />
    </Group>
  );
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

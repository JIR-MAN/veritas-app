import { useState } from 'react';
import { View } from 'react-native';
import { confirm, notify } from '@/components/confirm';
import { useInspectTarget } from '@/components/useInspectTarget';
import { askDetector, BAND_TEXT, type DetectorOpinion } from '@/features/detectors/relay-client';
import { DETECTORS, detectorEnabled, type DetectorService } from '@/features/detectors/services';
import { Field, Group, Pill, Row, Screen, Text, space } from '@/ui';

export default function DetectorsScreen() {
  const { file, mime } = useInspectTarget();
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, DetectorOpinion>>({});

  async function send(d: DetectorService) {
    if (!file) return;
    const ok = await confirm(`Send to ${d.name}?`, `${d.dataNote} Their terms apply. Results are their model’s opinion, which can be wrong.`, 'Send', false);
    if (!ok) return;
    setBusy(d.id);
    try {
      const r = await askDetector(d.id, file, mime);
      setResults((x) => ({ ...x, [d.id]: r }));
    } catch (e) {
      notify('No result', `${d.name} could not check this file. ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen title="AI detection services">
      <Text variant="callout" color="textMuted" style={{ marginBottom: space.xl }}>
        These services look at the image itself and give their opinion. They can be wrong in both directions, and the file has to be uploaded to them. They stay switched off until the VERITAS team approves an account and a budget.
      </Text>
      {DETECTORS.map((d) => {
        const on = detectorEnabled(d.id);
        const r = results[d.id];
        return (
          <Group key={d.id} title={d.name} action={<Pill label={on ? 'Connected' : 'Not connected'} tone={on ? 'accent' : 'neutral'} />}>
            <Field label="Checks" value={d.media} />
            <Field label="Cost" value={d.cost} />
            <Field label="Free allowance" value={d.freeAllowance} />
            {r ? (
              <View style={{ padding: space.lg, gap: 2 }}>
                <Text variant="label">{BAND_TEXT[r.band]}</Text>
                <Text variant="footnote" color="textMuted">
                  {d.name}’s score: {r.score.toFixed(2)} on a 0–1 scale ({r.model}). This is the provider’s opinion. VERITAS hasn’t independently tested it yet.
                </Text>
              </View>
            ) : on && file ? (
              <Row icon="upload-cloud" iconColor="accent" title={busy === d.id ? 'Sending…' : `Send this file to ${d.name}`} onPress={busy ? undefined : () => send(d)} />
            ) : null}
          </Group>
        );
      })}
      <Text variant="footnote" color="textFaint">
        Prices checked 11 Nov 2026 from public sources. They are confirmed again before any sign-up.
      </Text>
    </Screen>
  );
}

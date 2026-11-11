import { View } from 'react-native';
import { Group, Screen, Text, space } from '@/ui';

const RESULTS: [string, string][] = [
  ['AI generation declared', 'Valid credentials from a recognised signer say AI made the file or part of it.'],
  ['Camera origin recorded', 'Valid credentials say a capture device made the file. The scene could still be staged.'],
  ['Valid credentials', 'Signed by a recognised source, with no statement about AI.'],
  ['Signed by an unrecognised source', 'The credentials are intact, but anyone can sign. Treat what they say with care.'],
  ['Credentials failed validation', 'The file or its credentials were changed after signing.'],
  ['Origin unknown', 'No credentials. This is the most common result and says nothing about whether a file is real or fake.'],
];

export default function HowChecksWork() {
  return (
    <Screen title="How checks work">
      <Text variant="title" style={{ marginBottom: space.sm }}>
        What VERITAS looks at
      </Text>
      <Text variant="callout" color="textMuted" style={{ marginBottom: space.xl }}>
        VERITAS reads Content Credentials (the C2PA standard) using the official open-source library, on your device. It checks the signature, whether the file changed after signing, and whether the signer is on a recognised trust list.
      </Text>
      <Group title="Results">
        {RESULTS.map(([h, b]) => (
          <View key={h} style={{ padding: space.lg, gap: 2 }}>
            <Text variant="label">{h}</Text>
            <Text variant="footnote" color="textMuted">
              {b}
            </Text>
          </View>
        ))}
      </Group>
      <Group title="Not available yet">
        <View style={{ padding: space.lg, gap: space.sm }}>
          <Text variant="callout" color="textMuted">
            AI watermark checks and AI forensic detectors are not connected. They will only be added once a provider is authorised and independently evaluated. Until then they are always shown as “not checked”.
          </Text>
          <Text variant="callout" color="textMuted">
            VERITAS never shows a percentage or a “fake” score.
          </Text>
        </View>
      </Group>
      <Group title="Trust lists">
        <View style={{ padding: space.lg }}>
          <Text variant="callout" color="textMuted">
            Signers are recognised using the C2PA Conformance trust list, and the Content Authenticity Initiative’s older interim list. Both are built into the app and updated with each release.
          </Text>
        </View>
      </Group>
    </Screen>
  );
}

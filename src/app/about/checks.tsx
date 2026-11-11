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

const OTHER: [string, string][] = [
  ['File details (on this device)', 'Hidden details such as EXIF and XMP can carry an AI label or the name of an AI tool. A strong clue, but anyone can add or remove them.'],
  ['Invisible watermark (on this device)', 'Reads Adobe’s open TrustMark watermark. Needs a one-time, free download of Adobe’s reader files. Your image is not uploaded.'],
  ['Google SynthID (Google’s website)', 'Google’s watermark, used by Google and some other AI tools, can only be checked on Google’s own SynthID page. VERITAS opens it for you.'],
  ['Search the web', 'Google Lens, TinEye or Bing can find earlier copies of an image. You choose whether to send it.'],
  ['Error levels (advanced)', 'A visual aid that can point to edited areas. It can’t tell whether an image is AI-generated.'],
  ['Paid AI detection services', 'Services that look at the image and give an opinion. Switched off until the VERITAS team approves one.'],
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
      <Group title="Other checks">
        {OTHER.map(([h, b]) => (
          <View key={h} style={{ padding: space.lg, gap: 2 }}>
            <Text variant="label">{h}</Text>
            <Text variant="footnote" color="textMuted">
              {b}
            </Text>
          </View>
        ))}
      </Group>
      <Group title="What no check can do">
        <View style={{ padding: space.lg, gap: space.sm }}>
          <Text variant="callout" color="textMuted">
            No tool can prove that an image is real. Finding nothing (no credentials, no AI label, no watermark) only means the file carries no such signal.
          </Text>
          <Text variant="callout" color="textMuted">
            VERITAS never makes up a “fake” score. Paid services, if switched on, show their own score, clearly labelled as their opinion.
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

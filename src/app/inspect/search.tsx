import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Platform, View } from 'react-native';
import { confirm } from '@/components/confirm';
import { useInspectTarget } from '@/components/useInspectTarget';
import { SEARCH_TOOLS, SYNTHID, type WebTool } from '@/features/detectors/services';
import { Group, Row, Screen, Text, space } from '@/ui';

async function open(url: string) {
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else await WebBrowser.openBrowserAsync(url);
}

export default function SearchScreen() {
  const { file, sourceUrl } = useInspectTarget();

  async function upload(t: WebTool) {
    const ok = await confirm(
      `Open ${t.name}?`,
      `You’ll upload the image to ${t.company} yourself on their website. VERITAS doesn’t send it. ${t.company}’s privacy terms apply.`,
      'Open',
      false,
    );
    if (ok) await open(t.uploadUrl);
  }

  async function byLink(t: WebTool) {
    if (!sourceUrl || !t.byUrl) return;
    const ok = await confirm(`Search ${t.name} by link?`, `The link you saved will be sent to ${t.company}. This works best when the link points to the image itself.`, 'Search', false);
    if (ok) await open(t.byUrl(sourceUrl));
  }

  async function shareToApp() {
    if (!file || Platform.OS === 'web') return;
    await Sharing.shareAsync(file.uri, { mimeType: file.mimeType, dialogTitle: 'Search with an app' });
  }

  return (
    <Screen title="Search the web">
      <Text variant="callout" color="textMuted" style={{ marginBottom: space.xl }}>
        Finding the earliest copy of an image often shows where it really came from. These services are run by other companies, and nothing is sent unless you choose to.
      </Text>
      <Group title="Check for an AI watermark" footer="Detects SynthID only. A “no watermark” answer doesn’t mean the image is real.">
        <Row icon="droplet" title={SYNTHID.name} subtitle={SYNTHID.what} onPress={() => upload(SYNTHID)} testID="open-synthid" />
      </Group>
      <Group title="Reverse image search">
        {SEARCH_TOOLS.map((t) => (
          <Row key={t.id} icon="external-link" title={t.name} subtitle={t.what} onPress={() => upload(t)} testID={`open-${t.id}`} />
        ))}
      </Group>
      {sourceUrl ? (
        <Group title="Search using the link you saved" footer={sourceUrl}>
          {SEARCH_TOOLS.map((t) => (
            <Row key={t.id} icon="link" title={`${t.name} by link`} onPress={() => byLink(t)} />
          ))}
        </Group>
      ) : null}
      {file && Platform.OS !== 'web' ? (
        <Group title="Use an app on this phone" footer="For example, choose the Google app to search with Lens.">
          <Row icon="share" title="Share the image to an app" onPress={shareToApp} />
        </Group>
      ) : null}
      <View style={{ height: space.xl }} />
    </Screen>
  );
}

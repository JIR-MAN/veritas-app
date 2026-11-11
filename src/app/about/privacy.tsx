import { Platform, View } from 'react-native';
import { storageNote } from '@/features/evidence/fileio';
import { Group, Row, Screen, Text, space } from '@/ui';

export default function Privacy() {
  return (
    <Screen title="Privacy">
      <Text variant="title" style={{ marginBottom: space.sm }}>
        Your files stay with you
      </Text>
      <Text variant="callout" color="textMuted" style={{ marginBottom: space.xl }}>
        This beta has no accounts, no cloud storage and no analytics.
      </Text>
      <Group title="On this device">
        <Row icon="search" title="Checks run on the device" subtitle="Files are never uploaded to check them." />
        <Row icon="hash" title="Fingerprints are calculated locally" subtitle="SHA-256, computed by the device." />
        <Row icon="hard-drive" title="Cases and copies stay local" subtitle={storageNote} />
        <Row icon="cloud-off" title="Online credentials aren’t fetched" subtitle="Some files point to credentials on a website. VERITAS doesn’t contact it, so it can’t learn what you’re checking." />
      </Group>
      <Group title="When you share">
        <View style={{ padding: space.lg }}>
          <Text variant="callout" color="textMuted">
            Reports and files only leave the app when you share them yourself, for example by email. VERITAS never sends anything on your behalf.
          </Text>
        </View>
      </Group>
      <Group title="Deleting">
        <View style={{ padding: space.lg }}>
          <Text variant="callout" color="textMuted">
            Delete a record, a case, or everything from Settings.{Platform.OS !== 'web' ? ' Deleting the app also removes all its data.' : ''}
          </Text>
        </View>
      </Group>
    </Screen>
  );
}

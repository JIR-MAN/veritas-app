import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { PageTitle } from '@/components/PageTitle';
import { useStartCheck } from '@/components/useStartCheck';
import { engineClient } from '@/features/check/engine-client';
import { SAMPLES } from '@/features/evidence/samples';
import { ActivityIndicatorRow } from '@/components/ActivityIndicatorRow';
import { Button, Group, Row, Screen, Text, space, useLayout } from '@/ui';

function useEngineStatus() {
  return useSyncExternalStore(engineClient.onStatus, engineClient.status, engineClient.status);
}

export default function Check() {
  const { run, busy } = useStartCheck();
  const status = useEngineStatus();
  const { isWide } = useLayout();

  const available = (
    <Group title="What VERITAS checks" footer="Unavailable checks are always shown as “not checked”. VERITAS never guesses a result.">
      <Row
        icon="award"
        iconColor={status === 'failed' ? 'critical' : 'success'}
        title="Content Credentials (C2PA)"
        subtitle="Signed records of how a file was made"
        value={status === 'ready' ? 'On device' : status === 'loading' ? 'Starting…' : 'Unavailable'}
      />
      <Row icon="droplet" title="AI watermarks" subtitle="Needs an authorised provider" value="Not connected" />
      <Row icon="cpu" title="AI forensic detector" subtitle="Needs an independently evaluated service" value="Not connected" />
    </Group>
  );

  const samples = (
    <Group title="Sample files" footer="Samples are signed with a public test certificate, so they show as an unrecognised signer.">
      {SAMPLES.map((s) =>
        busy === s.key ? (
          <ActivityIndicatorRow key={s.key} label={`Opening ${s.title}`} />
        ) : (
          <Row key={s.key} icon="image" title={s.title} subtitle={s.subtitle} onPress={() => run(s.key)} testID={`sample-${s.key}`} />
        ),
      )}
    </Group>
  );

  return (
    <Screen testID="screen-check" wide={isWide}>
      <PageTitle title="Check" subtitle="See what a file’s Content Credentials say about where it came from." />
      <View style={{ gap: space.sm, marginBottom: space.xxl }}>
        <Button label="Choose a file" icon="upload" onPress={() => run('pick')} busy={busy === 'pick'} testID="check-pick" />
        <Text variant="footnote" color="textMuted" center>
          Images, video, audio or PDF. Use the original file if you have it.
        </Text>
      </View>
      {isWide ? (
        <View style={{ flexDirection: 'row', gap: space.xl }}>
          <View style={{ flex: 1 }}>{available}</View>
          <View style={{ flex: 1 }}>{samples}</View>
        </View>
      ) : (
        <>
          {available}
          {samples}
        </>
      )}
      <Group>
        <Row icon="book-open" title="How checks work" onPress={() => router.push('/about/checks')} />
      </Group>
    </Screen>
  );
}

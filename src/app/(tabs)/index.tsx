import { router } from 'expo-router';
import { View } from 'react-native';
import { PageTitle } from '@/components/PageTitle';
import { useStartCheck } from '@/components/useStartCheck';
import { ISSUE_LABELS } from '@/features/cases/model';
import { useData } from '@/features/cases/store';
import { formatDate, plural } from '@/features/format';
import { Button, Empty, Group, Row, Screen, Text, space } from '@/ui';

export default function Home() {
  const { run, busy } = useStartCheck();
  const recent = useData((s) => s.cases).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const counts = useData((s) => s.evidence);

  return (
    <Screen testID="screen-home">
      <PageTitle title="VERITAS" beta subtitle="Check suspicious media and keep a reliable record." />

      <View style={{ gap: space.sm, marginBottom: space.xxl }}>
        <Button label="Check a file" icon="search" onPress={() => run('pick')} busy={busy === 'pick'} testID="home-check" />
        <Button label="Start a case" icon="folder-plus" variant="secondary" onPress={() => router.push('/case/new')} testID="home-new-case" />
      </View>

      <Group
        title="Recent cases"
        action={recent.length ? <Button label="All" variant="quiet" full={false} onPress={() => router.navigate('/cases')} /> : undefined}>
        {recent.length ? (
          recent.map((c) => (
            <Row
              key={c.id}
              icon="folder"
              title={c.title}
              subtitle={`${ISSUE_LABELS[c.category]} · ${plural(counts.filter((e) => e.caseId === c.id).length, 'file')} · ${formatDate(c.updatedAt)}`}
              onPress={() => router.push({ pathname: '/case/[id]', params: { id: c.id } })}
            />
          ))
        ) : (
          <View style={{ padding: space.lg }}>
            <Empty icon="folder" title="No cases yet" body="A case keeps files, fingerprints and your notes together." />
          </View>
        )}
      </Group>

      <Group title="New here?">
        <Row icon="image" title="Try a sample file" subtitle="See a real check without using your own files" onPress={() => router.navigate('/check')} />
        <Row icon="shield" title="Your files stay on this device" subtitle="Nothing is uploaded" onPress={() => router.push('/about/privacy')} />
      </Group>

      <Text variant="footnote" color="textFaint" center>
        If you are in immediate danger, contact your local emergency services.
      </Text>
    </Screen>
  );
}

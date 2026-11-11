import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaseDetail } from '@/components/CaseDetail';
import { PageTitle } from '@/components/PageTitle';
import { ISSUE_LABELS } from '@/features/cases/model';
import { useData } from '@/features/cases/store';
import { formatDate, plural } from '@/features/format';
import { Button, Empty, Group, Row, Screen, Text, space, useColors, useLayout } from '@/ui';

export default function Cases() {
  const list = useData((s) => s.cases).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const evidence = useData((s) => s.evidence);
  const { isTablet } = useLayout();
  const [selected, setSelected] = useState<string | null>(null);
  const c = useColors();
  const insets = useSafeAreaInsets();
  const current = selected && list.some((k) => k.id === selected) ? selected : list[0]?.id ?? null;

  const newBtn = <Button label="New case" icon="plus" variant="secondary" full={false} onPress={() => router.push('/case/new')} testID="cases-new" />;

  const rows = list.map((k) => (
    <Row
      key={k.id}
      icon="folder"
      title={k.title}
      subtitle={`${ISSUE_LABELS[k.category]} · ${plural(evidence.filter((e) => e.caseId === k.id).length, 'file')} · ${formatDate(k.updatedAt)}`}
      selected={isTablet && current === k.id}
      onPress={() => (isTablet ? setSelected(k.id) : router.push({ pathname: '/case/[id]', params: { id: k.id } }))}
    />
  ));

  const empty = (
    <Empty
      icon="folder"
      title="No cases yet"
      body="Start a case to keep files, fingerprints and notes about one incident together."
      action={<Button label="Start a case" onPress={() => router.push('/case/new')} />}
    />
  );

  if (!isTablet) {
    return (
      <Screen testID="screen-cases">
        <PageTitle title="Cases" trailing={list.length ? newBtn : undefined} />
        {list.length ? <Group>{rows}</Group> : empty}
      </Screen>
    );
  }

  return (
    <View style={[styles.split, { backgroundColor: c.canvas }]} testID="screen-cases">
      <View style={[styles.master, { borderRightColor: c.border }]}>
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
            <Text variant="display">Cases</Text>
            {list.length ? newBtn : null}
          </View>
          {list.length ? <Group>{rows}</Group> : null}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.xxl, paddingTop: insets.top + space.xl, maxWidth: 1000 }}>
          {current ? <CaseDetail id={current} embedded /> : empty}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: 'row' },
  master: { width: 340, borderRightWidth: StyleSheet.hairlineWidth },
});

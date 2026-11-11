import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { ISSUE_LABELS, type IssueCategory } from '@/features/cases/model';
import { cases } from '@/features/cases/store';
import { Button, Group, Icon, Row, Screen, space, useColors } from '@/ui';

export default function NewCase() {
  const c = useColors();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory | null>(null);

  function create() {
    if (!category) return;
    const k = cases.create(title || ISSUE_LABELS[category], category);
    router.dismissTo({ pathname: '/case/[id]', params: { id: k.id } });
  }

  return (
    <Screen
      title="New case"
      footer={<Button label="Create case" onPress={create} disabled={!category} hint={category ? undefined : 'Choose what happened first'} testID="create-case" />}>
      <Group title="Name" footer="Only stored on this device. Use something you’ll recognise.">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Fake video of me"
          placeholderTextColor={c.textFaint}
          accessibilityLabel="Case name"
          maxLength={80}
          style={{ color: c.text, fontSize: 16, padding: space.lg, minHeight: 48 }}
          testID="case-title"
        />
      </Group>
      <Group title="What happened?">
        {(Object.keys(ISSUE_LABELS) as IssueCategory[]).map((k) => (
          <Row
            key={k}
            title={ISSUE_LABELS[k]}
            selected={category === k}
            onPress={() => setCategory(k)}
            trailing={category === k ? <Icon name="check" color="accent" /> : <></>}
            testID={`cat-${k}`}
          />
        ))}
      </Group>
    </Screen>
  );
}

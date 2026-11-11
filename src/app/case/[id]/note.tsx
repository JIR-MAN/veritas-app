import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { cases } from '@/features/cases/store';
import { Button, Group, Row, Screen, Text, space, useColors } from '@/ui';

import { parseLocal } from '@/features/format';

const pad = (n: number) => String(n).padStart(2, '0');

export default function AddNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const [now] = useState(() => new Date());
  const [text, setText] = useState('');
  const [date, setDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  const [time, setTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [approx, setApprox] = useState(false);
  const when = parseLocal(date, time);
  const future = when ? when.getTime() > now.getTime() + 60 * 60_000 : false;
  const valid = text.trim().length > 0 && !!when && !future;

  const input = { color: c.text, fontSize: 16, padding: space.lg, minHeight: 48 } as const;

  function save() {
    if (!valid || !when) return;
    cases.addNote(id, text, when.toISOString(), approx);
    router.back();
  }

  return (
    <Screen title="Add to timeline" footer={<Button label="Add to timeline" onPress={save} disabled={!valid} testID="save-note" />}>
      <Group title="What happened" footer="Stick to facts: who, what, where. You can add more entries later.">
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="e.g. A friend sent me a link to a video using my face."
          placeholderTextColor={c.textFaint}
          accessibilityLabel="What happened"
          style={[input, { minHeight: 120, textAlignVertical: 'top' }]}
          maxLength={2000}
          testID="note-text"
        />
      </Group>
      <Group title="When" footer={future ? 'That time is in the future.' : !when ? 'Use the format 2026-11-11 and 14:30.' : `Time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 3 }}>
            <Text variant="footnote" color="textMuted" style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
              Date
            </Text>
            <TextInput value={date} onChangeText={setDate} accessibilityLabel="Date, year month day" keyboardType="numbers-and-punctuation" style={input} />
          </View>
          <View style={{ flex: 2 }}>
            <Text variant="footnote" color="textMuted" style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
              Time
            </Text>
            <TextInput value={time} onChangeText={setTime} accessibilityLabel="Time, hours and minutes" keyboardType="numbers-and-punctuation" style={input} />
          </View>
        </View>
        <Row title="Approximate time" subtitle="Mark it if you’re not sure" trailing={<Switch value={approx} onValueChange={setApprox} accessibilityLabel="Approximate time" />} />
      </Group>
    </Screen>
  );
}

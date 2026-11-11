import { ActivityIndicator, View } from 'react-native';
import { Text, space, touch, useColors } from '@/ui';

export function ActivityIndicatorRow({ label }: { label: string }) {
  const c = useColors();
  return (
    <View accessible accessibilityLabel={label} style={{ minHeight: touch + 8, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg }}>
      <ActivityIndicator color={c.accent} />
      <Text variant="callout" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme';
import { radius, space } from './tokens';

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.box, { borderColor: c.border }]}>
      <Icon name={icon} size={24} color="textFaint" />
      <Text variant="headline" center>
        {title}
      </Text>
      {body ? (
        <Text variant="callout" color="textMuted" center>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: space.sm, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: space.sm, padding: space.xl, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
});

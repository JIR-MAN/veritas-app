import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme';
import { radius, space, touch } from './tokens';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  hint?: string;
  testID?: string;
  full?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, busy, hint, testID, full = true }: Props) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.surface : 'transparent';
  const fg = variant === 'primary' ? 'onPrimary' : variant === 'danger' ? 'critical' : variant === 'quiet' ? 'accent' : 'text';
  const inactive = disabled || busy;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        full && styles.full,
        { backgroundColor: bg, opacity: inactive ? 0.5 : pressed ? 0.82 : 1 },
        variant === 'secondary' && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: c.borderStrong },
        variant === 'quiet' && styles.quiet,
        variant === 'danger' && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: c.critical },
      ]}>
      <View style={styles.row}>
        {busy ? (
          <ActivityIndicator color={c[fg]} />
        ) : icon ? (
          <Icon name={icon} size={18} color={fg} />
        ) : null}
        <Text variant="label" color={fg}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: touch, borderRadius: radius.md, paddingHorizontal: space.xl, justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  quiet: { paddingHorizontal: space.sm, minHeight: 44 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
});

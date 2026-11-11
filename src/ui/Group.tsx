import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme';
import { radius, space, touch } from './tokens';

/** A titled, bordered group of rows — the main building block instead of free-floating cards. */
export function Group({ title, children, footer, action }: { title?: string; children: ReactNode; footer?: string; action?: ReactNode }) {
  const c = useColors();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {title || action ? (
        <View style={styles.head}>
          {title ? (
            <Text variant="caption" color="textMuted" accessibilityRole="header">
              {title}
            </Text>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.border }]}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.sep, { backgroundColor: c.border }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text variant="footnote" color="textMuted" style={styles.foot}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  iconColor?: Parameters<typeof Icon>[0]['color'];
  onPress?: () => void;
  trailing?: ReactNode;
  testID?: string;
  selected?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
};

export function Row({ title, subtitle, value, icon, iconColor = 'textMuted', onPress, trailing, testID, selected, destructive, accessibilityHint }: RowProps) {
  const c = useColors();
  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={destructive ? 'critical' : iconColor} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text variant="body" color={destructive ? 'critical' : 'text'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="textMuted" numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="callout" color="textMuted" style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress && !trailing ? <Icon name="chevron-right" size={18} color="textFaint" /> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}>{content}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [{ backgroundColor: pressed || selected ? c.surfaceMuted : 'transparent' }]}>
      {content}
    </Pressable>
  );
}

/** Label/value pair for factual records (hashes, dates). */
export function Field({ label, value, mono, selectable = true }: { label: string; value: string; mono?: boolean; selectable?: boolean }) {
  return (
    <View style={styles.field} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="footnote" color="textMuted">
        {label}
      </Text>
      <Text variant={mono ? 'footnote' : 'body'} mono={mono} selectable={selectable}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: space.xl },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm, paddingHorizontal: space.xs, minHeight: 20 },
  box: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: space.lg },
  foot: { marginTop: space.sm, paddingHorizontal: space.xs },
  row: { minHeight: touch + 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.md },
  icon: { width: 24, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
  field: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
});

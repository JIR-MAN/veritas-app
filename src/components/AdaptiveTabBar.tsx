/**
 * One navigation component, two compositions:
 *  - phones: compact bottom tab bar
 *  - tablets: left sidebar with product name and labelled destinations
 */
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Pill, Text, space, radius, useColors, useLayout, type IconName } from '@/ui';

export const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  check: { label: 'Check', icon: 'search' },
  cases: { label: 'Cases', icon: 'folder' },
  settings: { label: 'Settings', icon: 'settings' },
};

export function AdaptiveTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useColors();
  const { isTablet, isWide } = useLayout();
  const insets = useSafeAreaInsets();

  const items = state.routes.map((route, index) => {
    const meta = TAB_META[route.name] ?? { label: route.name, icon: 'circle' as IconName };
    const focused = state.index === index;
    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    return { key: route.key, meta, focused, onPress };
  });

  if (isTablet && !isWide) {
    // Compact navigation rail for tablets in portrait and split-screen.
    return (
      <View
        accessibilityRole="tablist"
        style={[styles.rail, { backgroundColor: c.surface, borderRightColor: c.border, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg, paddingLeft: insets.left }]}>
        <Text variant="caption" color="accent" style={{ marginBottom: space.lg, letterSpacing: 1.5 }}>
          V
        </Text>
        {items.map((it) => (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityLabel={it.meta.label}
            accessibilityState={{ selected: it.focused }}
            onPress={it.onPress}
            testID={`tab-${it.meta.label}`}
            style={styles.railItem}>
            <View style={[styles.railIcon, { backgroundColor: it.focused ? c.surfaceMuted : 'transparent' }]}>
              <Icon name={it.meta.icon} size={20} color={it.focused ? 'accent' : 'textMuted'} />
            </View>
            <Text variant="footnote" color={it.focused ? 'text' : 'textMuted'} style={{ fontSize: 12, fontWeight: it.focused ? '600' : '400' }} maxFontSizeMultiplier={1.3}>
              {it.meta.label}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'center' }}>
          <Pill label="Beta" tone="caution" />
        </View>
      </View>
    );
  }

  if (isTablet) {
    return (
      <View
        accessibilityRole="tablist"
        style={[styles.side, { backgroundColor: c.surface, borderRightColor: c.border, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg, paddingLeft: insets.left + space.lg }]}>
        <View style={styles.brand}>
          <Text variant="headline" style={{ letterSpacing: 2 }}>
            VERITAS
          </Text>
          <Pill label="Beta" tone="caution" />
        </View>
        <View style={{ gap: space.xs }}>
          {items.map((it) => (
            <Pressable
              key={it.key}
              accessibilityRole="tab"
              accessibilityLabel={it.meta.label}
              accessibilityState={{ selected: it.focused }}
              onPress={it.onPress}
              testID={`tab-${it.meta.label}`}
              style={({ pressed }) => [styles.sideItem, { backgroundColor: it.focused ? c.surfaceMuted : pressed ? c.surfaceMuted : 'transparent' }]}>
              <Icon name={it.meta.icon} size={20} color={it.focused ? 'accent' : 'textMuted'} />
              <Text variant="label" color={it.focused ? 'text' : 'textMuted'}>
                {it.meta.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bottom, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="tab"
          accessibilityLabel={it.meta.label}
          accessibilityState={{ selected: it.focused }}
          onPress={it.onPress}
          testID={`tab-${it.meta.label}`}
          style={styles.bottomItem}>
          <Icon name={it.meta.icon} size={22} color={it.focused ? 'accent' : 'textFaint'} />
          <Text variant="footnote" color={it.focused ? 'text' : 'textMuted'} style={{ fontWeight: it.focused ? '600' : '400', fontSize: 12 }} maxFontSizeMultiplier={1.3}>
            {it.meta.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  side: { width: 232, borderRightWidth: StyleSheet.hairlineWidth, paddingRight: space.lg, gap: space.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.md },
  rail: { width: 88, borderRightWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: space.md },
  railItem: { alignItems: 'center', gap: 4, minHeight: 56, width: 80 },
  railIcon: { width: 56, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.sm },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
});

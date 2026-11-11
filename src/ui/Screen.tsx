import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useLayout } from './theme';
import { contentMaxWidth, space } from './tokens';

type Props = {
  children: ReactNode;
  title?: string;
  /** Large title shown in the content (phones) instead of the nav bar. */
  footer?: ReactNode;
  scroll?: boolean;
  wide?: boolean;
  headerShown?: boolean;
  testID?: string;
};

/** Standard screen frame: canvas background, safe areas, readable max width, sticky footer for the primary action. */
export function Screen({ children, title, footer, scroll = true, wide, headerShown, testID }: Props) {
  const c = useColors();
  const { isTablet } = useLayout();
  const insets = useSafeAreaInsets();
  const pad = isTablet ? space.xxl : space.lg;
  const inner = (
    <View style={[styles.inner, { paddingHorizontal: pad, maxWidth: wide ? 1200 : contentMaxWidth }]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      testID={testID}
      style={{ flex: 1, backgroundColor: c.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {title !== undefined || headerShown !== undefined ? (
        <Stack.Screen options={{ title, headerShown: headerShown ?? true }} />
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingTop: space.lg, paddingBottom: space.xxxl + (footer ? 0 : insets.bottom) }}
          keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: space.lg }}>{inner}</View>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            { borderTopColor: c.border, backgroundColor: c.canvas, paddingBottom: Math.max(insets.bottom, space.lg), paddingHorizontal: pad },
          ]}>
          <View style={[styles.inner, { maxWidth: wide ? 1200 : contentMaxWidth, gap: space.sm }]}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', alignSelf: 'center', flexGrow: 1 },
  footer: { paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});

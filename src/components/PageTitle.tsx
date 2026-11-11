import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill, Text, space, useLayout } from '@/ui';
import type { ReactNode } from 'react';

/** Large in-content title for top-level tabs. */
export function PageTitle({ title, subtitle, trailing, beta }: { title: string; subtitle?: string; trailing?: ReactNode; beta?: boolean }) {
  const insets = useSafeAreaInsets();
  const { isTablet } = useLayout();
  return (
    <View style={{ paddingTop: insets.top + (isTablet ? space.xl : space.md), marginBottom: space.xl, gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 }}>
          <Text variant="display">{title}</Text>
          {beta && !isTablet ? <Pill label="Beta" tone="caution" /> : null}
        </View>
        {trailing}
      </View>
      {subtitle ? (
        <Text variant="callout" color="textMuted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

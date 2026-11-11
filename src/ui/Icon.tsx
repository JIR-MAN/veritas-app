import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useColors } from './theme';
import type { Palette } from './tokens';

export type IconName = ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 20, color = 'text' }: { name: IconName; size?: number; color?: keyof Palette }) {
  const c = useColors();
  return <Feather name={name} size={size} color={c[color]} accessibilityElementsHidden importantForAccessibility="no" />;
}

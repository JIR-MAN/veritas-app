import { useColorScheme, useWindowDimensions } from 'react-native';
import { useSettings } from '@/features/settings/store';
import { breakpoints, palettes, type Palette } from './tokens';

export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { appearance } = useSettings();
  if (appearance === 'light' || appearance === 'dark') return appearance;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): Palette {
  return palettes[useScheme()];
}

/** Layout class used to switch between phone and tablet compositions. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= breakpoints.tablet;
  const isWide = width >= breakpoints.wide;
  return { width, height, isTablet, isWide, isLandscape: width > height };
}

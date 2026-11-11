/**
 * VERITAS design tokens. Calm, editorial, trust-oriented: navy, teal, neutrals.
 * 8-point grid; every spacing value is a multiple of 4.
 */
import { Platform } from 'react-native';

const light = {
  canvas: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0F4',
  border: '#DFE3EA',
  borderStrong: '#C5CCD7',
  text: '#0E1A2B',
  textMuted: '#556275',
  textFaint: '#7B8798',
  primary: '#13294B',
  onPrimary: '#FFFFFF',
  accent: '#0D6E66',
  accentSoft: '#E1F1EF',
  info: '#1F4FB8',
  infoSoft: '#E5ECFA',
  caution: '#9A5B00',
  cautionSoft: '#FBF0DC',
  critical: '#B4232A',
  criticalSoft: '#FBE7E8',
  success: '#17704A',
  successSoft: '#E2F3EA',
  overlay: 'rgba(14,26,43,0.4)',
};

export type Palette = typeof light;

const dark: Palette = {
  canvas: '#0A1120',
  surface: '#111A2C',
  surfaceMuted: '#18233A',
  border: '#24304A',
  borderStrong: '#36445F',
  text: '#E8EDF4',
  textMuted: '#A3AEC0',
  textFaint: '#7D899D',
  primary: '#D5E2F7',
  onPrimary: '#0A1120',
  accent: '#5CC8BC',
  accentSoft: '#11332F',
  info: '#8FB0F5',
  infoSoft: '#16264A',
  caution: '#F0B455',
  cautionSoft: '#33260F',
  critical: '#F2878C',
  criticalSoft: '#3A1619',
  success: '#6FD3A0',
  successSoft: '#11301F',
  overlay: 'rgba(0,0,0,0.6)',
};

export const palettes = { light, dark };

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

export const fontFamily = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: undefined,
});
export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const, letterSpacing: -0.4 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '600' as const, letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.3 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
};
export type TypeVariant = keyof typeof type;

/** Minimum touch target (Apple HIG 44pt, Material 48dp). */
export const touch = 48;

export const breakpoints = { tablet: 768, wide: 1100 };
export const contentMaxWidth = 720;

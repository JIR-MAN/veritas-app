import { Text as RNText, type TextProps } from 'react-native';
import { fontFamily, monoFamily, type as typeScale, type Palette, type TypeVariant } from './tokens';
import { useColors } from './theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: keyof Palette;
  mono?: boolean;
  center?: boolean;
};

export function Text({ variant = 'body', color = 'text', mono, center, style, ...rest }: Props) {
  const c = useColors();
  const isHeading = variant === 'display' || variant === 'title' || variant === 'headline';
  return (
    <RNText
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={isHeading ? 1.6 : 2}
      style={[
        typeScale[variant],
        { color: c[color], fontFamily: mono ? monoFamily : fontFamily },
        variant === 'caption' && { textTransform: 'uppercase' },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}

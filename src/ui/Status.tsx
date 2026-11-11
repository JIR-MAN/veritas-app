import { StyleSheet, View } from 'react-native';
import type { Tone, CheckLine } from '@/features/check/classify';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme';
import { radius, space } from './tokens';

const TONE: Record<Tone, { fg: 'text' | 'info' | 'caution' | 'critical'; bg: 'surfaceMuted' | 'infoSoft' | 'cautionSoft' | 'criticalSoft'; icon: IconName }> = {
  neutral: { fg: 'text', bg: 'surfaceMuted', icon: 'help-circle' },
  info: { fg: 'info', bg: 'infoSoft', icon: 'info' },
  caution: { fg: 'caution', bg: 'cautionSoft', icon: 'alert-triangle' },
  critical: { fg: 'critical', bg: 'criticalSoft', icon: 'x-octagon' },
};

export function VerdictBanner({ tone, headline, summary }: { tone: Tone; headline: string; summary: string }) {
  const c = useColors();
  const t = TONE[tone];
  return (
    <View
      testID="verdict"
      accessible
      accessibilityLabel={`${headline}. ${summary}`}
      style={[styles.banner, { backgroundColor: c[t.bg] }]}>
      <View style={styles.bannerHead}>
        <Icon name={t.icon} size={22} color={t.fg} />
        <Text variant="title" color={t.fg} style={{ flex: 1 }}>
          {headline}
        </Text>
      </View>
      <Text variant="callout">{summary}</Text>
    </View>
  );
}

const CHECK_STATE: Record<CheckLine['state'], { icon: IconName; color: 'success' | 'critical' | 'caution' | 'info' | 'textFaint'; word: string }> = {
  pass: { icon: 'check-circle', color: 'success', word: 'Passed' },
  fail: { icon: 'x-circle', color: 'critical', word: 'Failed' },
  warn: { icon: 'alert-circle', color: 'caution', word: 'Warning' },
  info: { icon: 'info', color: 'info', word: 'Information' },
  not_run: { icon: 'minus-circle', color: 'textFaint', word: 'Not run' },
  unavailable: { icon: 'slash', color: 'textFaint', word: 'Not available' },
};

export function CheckRow({ line }: { line: CheckLine }) {
  const s = CHECK_STATE[line.state];
  return (
    <View style={styles.check} accessible accessibilityLabel={`${line.label}: ${s.word}. ${line.detail}`}>
      <Icon name={s.icon} size={20} color={s.color} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.checkHead}>
          <Text variant="label" style={{ flex: 1 }}>
            {line.label}
          </Text>
          <Text variant="footnote" color={s.color}>
            {s.word}
          </Text>
        </View>
        <Text variant="footnote" color="textMuted">
          {line.detail}
        </Text>
      </View>
    </View>
  );
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone | 'accent' }) {
  const c = useColors();
  const map = { neutral: ['surfaceMuted', 'textMuted'], info: ['infoSoft', 'info'], caution: ['cautionSoft', 'caution'], critical: ['criticalSoft', 'critical'], accent: ['accentSoft', 'accent'] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c[bg] }]}>
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.lg, padding: space.lg, gap: space.sm, marginBottom: space.xl },
  bannerHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  check: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, alignItems: 'flex-start' },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3, alignSelf: 'flex-start' },
});

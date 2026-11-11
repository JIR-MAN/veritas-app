import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useInspectTarget } from '@/components/useInspectTarget';
import { runEla, type ElaResult } from '@/features/check/engine-client';
import { Empty, Group, Screen, Text, radius, space, useColors } from '@/ui';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ElaScreen() {
  const { file, mime, missing } = useInspectTarget();
  const c = useColors();
  const [res, setRes] = useState<ElaResult['ela'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supported = IMAGE_TYPES.includes(mime);

  useEffect(() => {
    if (!file || !supported) return;
    let alive = true;
    runEla(file, mime).then((r) => {
      if (!alive) return;
      if (r.type === 'ela') setRes(r.ela);
      else setError('The analysis could not be made for this image.');
    });
    return () => {
      alive = false;
    };
  }, [file, mime, supported]);

  if (missing || !file) return <Screen title="Error levels"><Empty icon="file" title="File not available" body="Open the check again to use this view." /></Screen>;
  if (!supported) return <Screen title="Error levels"><Empty icon="image" title="Images only" body="This view works for JPEG, PNG and WebP images." /></Screen>;

  return (
    <Screen title="Error levels">
      <View style={{ padding: space.lg, borderRadius: radius.lg, backgroundColor: c.cautionSoft, marginBottom: space.xl, gap: space.xs }}>
        <Text variant="label" color="caution">
          A visual aid, not a test
        </Text>
        <Text variant="callout">
          This view can’t tell whether an image is AI-generated or edited. Bright areas are normal around edges, text and fine detail. Use it only to spot areas worth a closer look.
        </Text>
      </View>
      {res ? (
        <Group title="Error level analysis" footer={`Re-saved at JPEG quality ${Math.round(res.quality * 100)}, differences brightened ${res.amplify}×. Made on this device.`}>
          <Image source={{ uri: res.png }} accessibilityLabel="Error level analysis image" style={{ width: '100%', aspectRatio: res.width / res.height, backgroundColor: '#000' }} resizeMode="contain" />
        </Group>
      ) : error ? (
        <Empty icon="alert-circle" title="Couldn’t make this view" body={error} />
      ) : (
        <View style={{ alignItems: 'center', padding: space.xxl, gap: space.md }}>
          <ActivityIndicator color={c.accent} />
          <Text variant="callout" color="textMuted">
            Analysing on this device…
          </Text>
        </View>
      )}
      <Group title="How to read it">
        <View style={{ padding: space.lg, gap: space.sm }}>
          <Text variant="callout" color="textMuted">• Similar texture everywhere: nothing stands out. That doesn’t mean the image is genuine.</Text>
          <Text variant="callout" color="textMuted">• One region much brighter or darker than similar surfaces nearby may have been pasted in or re-saved separately.</Text>
          <Text variant="callout" color="textMuted">• AI-generated images often look perfectly uniform here, so this view is weak at spotting them.</Text>
        </View>
      </Group>
    </Screen>
  );
}

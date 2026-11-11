import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { confirm } from '@/components/confirm';
import { useInspectTarget } from '@/components/useInspectTarget';
import { formatBytes } from '@/features/format';
import { readWatermark, type WatermarkResponse } from '@/features/watermark/client';
import { deleteModels, downloadModels, modelsBytes, modelsReady } from '@/features/watermark/models';
import { WatermarkHost } from '@/features/watermark/WatermarkHost';
import { Button, Empty, Field, Group, Screen, Text, VerdictBanner, space } from '@/ui';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Phase = { k: 'checking' } | { k: 'need_models' } | { k: 'downloading'; done: number; total: number } | { k: 'reading' } | { k: 'done'; res: WatermarkResponse } | { k: 'download_failed'; message: string };

export default function WatermarkScreen() {
  const { file, mime, missing } = useInspectTarget();
  const [phase, setPhase] = useState<Phase>({ k: 'checking' });
  const [stored, setStored] = useState(0);
  const supported = IMAGE_TYPES.includes(mime);

  const run = useCallback(async () => {
    if (!file) return;
    setPhase({ k: 'reading' });
    const res = await readWatermark(file, mime);
    setPhase({ k: 'done', res });
    setStored(await modelsBytes());
  }, [file, mime]);

  useEffect(() => {
    if (!file || !supported) return;
    let alive = true;
    modelsReady().then((ok) => {
      if (!alive) return;
      if (ok) void run();
      else setPhase({ k: 'need_models' });
    });
    return () => {
      alive = false;
    };
  }, [file, supported, run]);

  async function download() {
    const ok = await confirm(
      'Download the watermark reader?',
      'VERITAS will download Adobe’s free TrustMark reader files from Adobe’s server, once. Your image is not sent anywhere: it is read on this device. Use Wi-Fi if your data is limited.',
      'Download',
      false,
    );
    if (!ok) return;
    try {
      await downloadModels((done, total) => setPhase({ k: 'downloading', done, total }));
      await run();
    } catch (e) {
      await deleteModels();
      setPhase({ k: 'download_failed', message: (e as Error).message });
    }
  }

  async function remove() {
    if (!(await confirm('Remove the watermark reader?', 'You can download it again at any time.', 'Remove'))) return;
    await deleteModels();
    setStored(0);
    setPhase({ k: 'need_models' });
  }

  if (missing || !file) return <Screen title="Invisible watermark"><Empty icon="file" title="File not available" body="Open the check again to use this view." /></Screen>;
  if (!supported) return <Screen title="Invisible watermark"><Empty icon="image" title="Images only" body="The TrustMark reader works on JPEG, PNG and WebP images." /></Screen>;

  return (
    <Screen title="Invisible watermark">
      {phase.k === 'reading' || phase.k === 'done' ? <WatermarkHost /> : null}
      <Text variant="callout" color="textMuted" style={{ marginBottom: space.xl }}>
        Some tools hide a watermark in the pixels of an image. VERITAS can read Adobe’s open TrustMark watermark on this device. Other watermarks, such as Google’s SynthID, can only be checked on their owner’s website.
      </Text>

      {phase.k === 'checking' || phase.k === 'reading' ? (
        <View style={{ alignItems: 'center', padding: space.xxl, gap: space.md }}>
          <ActivityIndicator />
          <Text variant="callout" color="textMuted">
            {phase.k === 'reading' ? 'Reading the image on this device…' : 'Getting ready…'}
          </Text>
        </View>
      ) : null}

      {phase.k === 'need_models' || phase.k === 'download_failed' ? (
        <Group title="One-time download" footer="The reader files come from Adobe (MIT licence). After this, checks work offline.">
          <View style={{ padding: space.lg, gap: space.md }}>
            <Text variant="callout">To read TrustMark watermarks, VERITAS first needs Adobe’s free reader files. Only those files are downloaded. Your image never leaves this device.</Text>
            {phase.k === 'download_failed' ? (
              <Text variant="callout" color="critical">
                The download didn’t finish: {phase.message}
              </Text>
            ) : null}
            <Button label="Download the reader" icon="download" onPress={download} testID="wm-download" />
          </View>
        </Group>
      ) : null}

      {phase.k === 'downloading' ? (
        <View style={{ alignItems: 'center', padding: space.xxl, gap: space.md }}>
          <ActivityIndicator />
          <Text variant="callout" color="textMuted">
            Downloading reader files ({phase.done} of {phase.total})…
          </Text>
        </View>
      ) : null}

      {phase.k === 'done' ? <ResultView res={phase.res} /> : null}

      {phase.k === 'done' && stored > 0 ? (
        <Group footer={`The reader uses ${formatBytes(stored)} on this device.`}>
          <Button label="Remove the reader" variant="quiet" onPress={remove} />
        </Group>
      ) : null}
    </Screen>
  );
}

function ResultView({ res }: { res: WatermarkResponse }) {
  if (res.type === 'error') {
    return <Empty icon="alert-circle" title="Couldn’t read this image" body="The watermark reader could not finish. This is not a result about the image." />;
  }
  const r = res.result;
  if (r.present) {
    return (
      <>
        <VerdictBanner tone="info" headline="TrustMark watermark found" summary="The image carries an invisible TrustMark watermark. Tools add it to link a file back to its Content Credentials. It shows the image passed through such a tool. On its own it does not say whether AI made it." />
        <Group title="What was read">
          <Field label="Watermark type" value={`TrustMark, variant ${r.variant}`} />
          <Field label="Data format" value={r.schema} />
          <Field label="Hidden data" value={r.payload} mono />
        </Group>
      </>
    );
  }
  return (
    <VerdictBanner tone="neutral" headline="No TrustMark watermark found" summary="Most images have no watermark, so this says nothing about whether the image is real. Heavy cropping or editing can also remove one. Other watermarks, such as Google’s SynthID, are not read here." />
  );
}

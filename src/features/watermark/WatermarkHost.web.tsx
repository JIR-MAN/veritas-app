/** Web: the TrustMark reader page runs in a sandboxed, invisible iframe. */
import { Asset } from 'expo-asset';
import { useEffect, useRef } from 'react';
import { watermarkClient } from './client';

const ENGINE = require('../../../assets/engine/watermark-engine.html');

export function WatermarkHost() {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const src = Asset.fromModule(ENGINE).uri;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return;
      watermarkClient.receive(e.data);
    };
    window.addEventListener('message', onMsg);
    watermarkClient.attach((msg) => ref.current?.contentWindow?.postMessage(msg, '*'));
    return () => {
      window.removeEventListener('message', onMsg);
      watermarkClient.detach();
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      title="TrustMark watermark reader"
      aria-hidden
      tabIndex={-1}
      sandbox="allow-scripts"
      onError={() => watermarkClient.failed()}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0, left: -10, top: -10, pointerEvents: 'none' }}
    />
  );
}

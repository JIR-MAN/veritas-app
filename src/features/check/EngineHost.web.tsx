/** Web: the same engine page runs in a sandboxed, invisible iframe. */
import { Asset } from 'expo-asset';
import { useEffect, useRef } from 'react';
import { engineClient } from './engine-client';

const ENGINE = require('../../../assets/engine/c2pa-engine.html');

export function EngineHost() {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const src = Asset.fromModule(ENGINE).uri;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return;
      engineClient.receive(e.data);
    };
    window.addEventListener('message', onMsg);
    engineClient.attach((msg) => ref.current?.contentWindow?.postMessage(msg, '*'));
    return () => {
      window.removeEventListener('message', onMsg);
      engineClient.detach();
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      title="Content Credentials engine"
      aria-hidden
      tabIndex={-1}
      sandbox="allow-scripts"
      onError={() => engineClient.failed('Engine failed to load')}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0, left: -10, top: -10, pointerEvents: 'none' }}
    />
  );
}

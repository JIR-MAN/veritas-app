/**
 * Mounts the on-device TrustMark watermark reader in an invisible WebView.
 * The WebView has no network access to media: files are streamed in as bytes,
 * and the reader's Content-Security-Policy blocks outbound connections.
 */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { watermarkClient } from './client';

// The package's class typings don't match React 19's JSX types; props are checked at runtime by the library.
const WebView = RNWebView as unknown as ComponentType<any>;

const ENGINE = require('../../../assets/engine/watermark-engine.html');

export function WatermarkHost() {
  const ref = useRef<{ injectJavaScript: (js: string) => void } | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const asset = Asset.fromModule(ENGINE);
        await asset.downloadAsync();
        const text = await new File(asset.localUri ?? asset.uri).text();
        if (alive) setHtml(text);
      } catch {
        watermarkClient.failed();
      }
    })();
    return () => {
      alive = false;
      watermarkClient.detach();
    };
  }, []);

  useEffect(() => {
    if (!html) return;
    watermarkClient.attach((msg) => {
      ref.current?.injectJavaScript(`window.__veritas && window.__veritas.receive(${JSON.stringify(msg)});true;`);
    });
  }, [html]);

  if (!html) return null;
  return (
    <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WebView
        ref={ref}
        source={{ html, baseUrl: 'https://watermark.veritas.invalid/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        incognito
        cacheEnabled={false}
        allowFileAccess={false}
        onMessage={(e: { nativeEvent: { data: string } }) => watermarkClient.receive(e.nativeEvent.data)}
        onError={() => watermarkClient.failed()}
        onContentProcessDidTerminate={() => watermarkClient.failed()}
        onRenderProcessGone={() => watermarkClient.failed()}
        onShouldStartLoadWithRequest={(req: { url: string }) => req.url.startsWith('https://watermark.veritas.invalid') || req.url.startsWith('about:') || req.url.startsWith('data:') || req.url.startsWith('blob:')}
      />
    </View>
  );
}

const styles = StyleSheet.create({ hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 } });

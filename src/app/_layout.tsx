import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import { Pressable } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { EngineHost } from '@/features/check/EngineHost';
import { Text, palettes, useScheme } from '@/ui';

const CancelButton = () => (
  <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 8, minHeight: 44, justifyContent: 'center' }}>
    <Text variant="label" color="accent">
      Cancel
    </Text>
  </Pressable>
);

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useScheme();
  const c = palettes[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, background: c.canvas, card: c.canvas, text: c.text, border: c.border, primary: c.accent, notification: c.critical },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <EngineHost />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.canvas },
          headerTintColor: c.accent,
          headerTitleStyle: { color: c.text, fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.canvas },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="check/[id]" options={{ title: 'Result' }} />
        <Stack.Screen name="case/new" options={{ title: 'New case', presentation: 'modal', headerRight: CancelButton }} />
        <Stack.Screen name="case/[id]/index" options={{ title: 'Case' }} />
        <Stack.Screen name="case/[id]/note" options={{ title: 'Add to timeline', presentation: 'modal', headerRight: CancelButton }} />
        <Stack.Screen name="evidence/[id]" options={{ title: 'Evidence record' }} />
        <Stack.Screen name="about/checks" options={{ title: 'How checks work' }} />
        <Stack.Screen name="about/privacy" options={{ title: 'Privacy' }} />
        <Stack.Screen name="inspect/ela" options={{ title: 'Error levels' }} />
        <Stack.Screen name="inspect/search" options={{ title: 'Search the web' }} />
        <Stack.Screen name="inspect/detectors" options={{ title: 'AI detection services' }} />
        <Stack.Screen name="inspect/watermark" options={{ title: 'Invisible watermark' }} />
      </Stack>
    </ThemeProvider>
  );
}

import { Tabs } from 'expo-router/js-tabs';
import { AdaptiveTabBar, TAB_META } from '@/components/AdaptiveTabBar';
import { useColors, useLayout } from '@/ui';

export default function TabLayout() {
  const { isTablet } = useLayout();
  const c = useColors();
  return (
    <Tabs
      tabBar={(props) => <AdaptiveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: c.canvas },
      }}>
      {Object.entries(TAB_META).map(([name, m]) => (
        <Tabs.Screen key={name} name={name} options={{ title: m.label }} />
      ))}
    </Tabs>
  );
}

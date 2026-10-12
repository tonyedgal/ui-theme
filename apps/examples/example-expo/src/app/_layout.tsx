import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Storage from '@/storage';
import { useEffect, useState } from 'react';
import { UIThemeProvider, useUITheme, useReducedMotion } from 'uitheme-rn';
import { palettes } from '@/theme';
import { UIThemeTransitionProvider } from 'uitheme-rn/transitions';

void SplashScreen.preventAutoHideAsync();

function Navigation({
  onNavigationChange,
}: {
  onNavigationChange: (active: boolean) => void;
}) {
  const { resolvedTheme, colors, isHydrated } = useUITheme();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (isHydrated) void SplashScreen.hideAsync();
  }, [isHydrated]);
  const base = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: String(colors.accent),
          background: String(colors.background),
          card: String(colors.surface),
          text: String(colors.text),
          border: String(colors.separator),
        },
      }}
    >
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenListeners={{
          transitionStart: () => onNavigationChange(true),
          transitionEnd: () => onNavigationChange(false),
        }}
        screenOptions={{
          headerLargeTitleEnabled: true,
          contentStyle: { backgroundColor: colors.background },
          animation: reducedMotion ? 'fade' : 'default',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Appearance' }} />
        <Stack.Screen name="preview" options={{ title: 'Preview' }} />
        <Stack.Screen name="transitions" options={{ title: 'Transitions' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isNavigating, setNavigating] = useState(false);

  return (
    <UIThemeProvider
      palettes={palettes}
      storage={Storage}
      fallback={null}
      onStorageError={(error) =>
        console.error('Could not save appearance preferences', error)
      }
    >
      <UIThemeTransitionProvider
        enabled={!isNavigating}
        onError={(error) => console.error('Screen transition failed', error)}
      >
        <Navigation onNavigationChange={setNavigating} />
      </UIThemeTransitionProvider>
    </UIThemeProvider>
  );
}

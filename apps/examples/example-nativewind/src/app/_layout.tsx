import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Storage from '../storage';
import { UIThemeProvider, useUITheme } from 'uitheme-rn';
import { NativeWindTheme } from 'uitheme-rn/nativewind';
import { UIThemeTransitionProvider } from 'uitheme-rn/transitions';
import { palettes, scopes } from '../theme';

function Navigation() {
  const { colors, resolvedTheme } = useUITheme();

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          title: 'nativewind',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: String(colors.text),
        }}
      />
    </>
  );
}

export default function Layout() {
  return (
    <UIThemeProvider
      palettes={palettes}
      defaultColorTheme="default"
      storage={Storage}
      storageKey="uitheme-nativewind"
      fallback={null}
    >
      <NativeWindTheme themes={scopes}>
        <UIThemeTransitionProvider>
          <Navigation />
        </UIThemeTransitionProvider>
      </NativeWindTheme>
    </UIThemeProvider>
  );
}

import { useCallback, useState, type ReactNode } from 'react';
import { z } from 'zod';
import type { useNativeVariable as NativeVariableHook } from 'react-native-css/native';
import { Platform, View } from 'react-native';
import {
  styled,
  useUnstableNativeVariable,
  VariableContextProvider,
} from 'nativewind';
import {
  UIThemeColorsProvider,
  useUITheme,
  toThemeVariables,
  themeVariableNames,
  type ThemeColors,
} from 'uitheme-rn';
import { colorsFromVariables } from './css-variables';
import type { ThemeStyleScopes } from './styling-types';

// SAFETY: NativeWind exposes a native-only hook with a zero-argument web stub.
// CSSColors mounts only on native; web uses the inherited DOM variables below.
const useNativeVariable =
  useUnstableNativeVariable as typeof NativeVariableHook;

// Explicit interop also works when this entry has already been compiled by tsup.
const ThemeView = styled(View);

function CSSColors({ children }: { children: ReactNode }) {
  const background = useNativeVariable(themeVariableNames.background);
  const surface = useNativeVariable(themeVariableNames.surface);
  const text = useNativeVariable(themeVariableNames.text);

  const secondaryText = useNativeVariable(themeVariableNames.secondaryText);

  const separator = useNativeVariable(themeVariableNames.separator);
  const accent = useNativeVariable(themeVariableNames.accent);
  const onAccent = useNativeVariable(themeVariableNames.onAccent);

  if (Platform.OS === 'web' && !('document' in globalThis)) return null;

  return (
    <UIThemeColorsProvider
      colors={colorsFromVariables([
        background,
        surface,
        text,
        secondaryText,
        separator,
        accent,
        onAccent,
      ])}
    >
      {children}
    </UIThemeColorsProvider>
  );
}

function WebCSSColors({
  children,
  scope,
}: {
  children: ReactNode;
  scope: string;
}) {
  const [colors, setColors] = useState<ThemeColors | null>(null);

  const ref = useCallback(
    (view: View | null) => {
      if (!scope || !view) return;
      // SAFETY: React Native Web forwards a View ref to its host DOM element.
      const element = z.instanceof(Element).parse(view);
      const style = globalThis.getComputedStyle(element);
      setColors(
        colorsFromVariables(
          Object.values(themeVariableNames).map((name) =>
            style.getPropertyValue(name)
          )
        )
      );
    },
    [scope]
  );

  return (
    <View ref={ref} style={{ flex: 1 }}>
      {colors ? (
        <UIThemeColorsProvider colors={colors}>
          {children}
        </UIThemeColorsProvider>
      ) : null}
    </View>
  );
}

/** NativeWind 5: scoped variables or CSS-authored palette classes. */
export function NativeWindTheme({
  children,
  themes,
}: {
  children: ReactNode;
  themes?: ThemeStyleScopes;
}) {
  const theme = useUITheme();

  if (themes) {
    const className = themes[theme.colorTheme]?.[theme.resolvedTheme];

    if (!className)
      throw new Error(
        `Missing NativeWind class for ${theme.colorTheme}/${theme.resolvedTheme}.`
      );

    return (
      <ThemeView className={className} style={{ flex: 1 }}>
        {Platform.OS === 'web' ? (
          <WebCSSColors scope={className}>{children}</WebCSSColors>
        ) : (
          <CSSColors>{children}</CSSColors>
        )}
      </ThemeView>
    );
  }

  return (
    <VariableContextProvider value={toThemeVariables(theme.colors)}>
      {children}
    </VariableContextProvider>
  );
}

export type { ThemeStyleScopes } from './styling-types';

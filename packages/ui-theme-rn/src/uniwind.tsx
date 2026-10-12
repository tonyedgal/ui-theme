import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { ScopedTheme, ScopedVariables, useCSSVariable } from 'uniwind';
import {
  UIThemeColorsProvider,
  useUITheme,
  toThemeVariables,
  themeVariableNames,
} from 'uitheme-rn';
import { colorsFromVariables } from './css-variables';
import type { ThemeStyleScopes } from './styling-types';

const variableNames = Object.values(themeVariableNames);

function CSSColors({ children }: { children: ReactNode }) {
  const values = useCSSVariable(variableNames);

  if (Platform.OS === 'web' && !('document' in globalThis)) return null;

  return (
    <UIThemeColorsProvider colors={colorsFromVariables(values)}>
      {children}
    </UIThemeColorsProvider>
  );
}

/** Uniwind: keep the engine's selected theme local to this provider's subtree. */
export function UniwindTheme({
  children,
  themes,
}: {
  children: ReactNode;
  themes?: ThemeStyleScopes;
}) {
  const theme = useUITheme();

  if (themes) {
    const selected = themes[theme.colorTheme]?.[theme.resolvedTheme];

    if (!selected)
      throw new Error(
        `Missing Uniwind theme for ${theme.colorTheme}/${theme.resolvedTheme}.`
      );

    return (
      <ScopedTheme theme={selected}>
        <CSSColors>{children}</CSSColors>
      </ScopedTheme>
    );
  }

  return (
    <ScopedTheme theme={theme.resolvedTheme}>
      <ScopedVariables variables={toThemeVariables(theme.colors)}>
        {children}
      </ScopedVariables>
    </ScopedTheme>
  );
}

export type { ThemeStyleScopes } from './styling-types';

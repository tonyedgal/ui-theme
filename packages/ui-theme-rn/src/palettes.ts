import type { ColorValue } from 'react-native';

export interface ThemeColors {
  readonly background: ColorValue;
  readonly surface: ColorValue;
  readonly text: ColorValue;
  readonly secondaryText: ColorValue;
  readonly separator: ColorValue;
  readonly accent: ColorValue;
  readonly onAccent: ColorValue;
}

export interface ThemePalette {
  readonly label: string;
  readonly light: ThemeColors;
  readonly dark: ThemeColors;
}

/** CSS owns the colors; the styling adapter resolves them for native consumers. */
export interface CSSThemePalette {
  readonly label: string;
  readonly light?: never;
  readonly dark?: never;
}

export type ThemePaletteDefinition = ThemePalette | CSSThemePalette;

/** Explicit colors also work when the app preference differs from the OS. */
export const defaultPalettes = {
  default: {
    label: 'Default',
    light: {
      background: '#F2F2F7',
      surface: '#FFFFFF',
      text: '#000000',
      secondaryText: '#595960',
      separator: '#C6C6C8',
      accent: '#0063CC',
      onAccent: '#FFFFFF',
    },
    dark: {
      background: '#000000',
      surface: '#1C1C1E',
      text: '#FFFFFF',
      secondaryText: '#AEAEB2',
      separator: '#38383A',
      accent: '#69B4FF',
      onAccent: '#000000',
    },
  },
} as const satisfies Record<string, ThemePalette>;

export const themeTokens = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16 },
  typography: {
    title: { fontSize: 22, fontWeight: '600' },
    headline: { fontSize: 17, fontWeight: '600' },
    body: { fontSize: 17, fontWeight: '400' },
    subhead: { fontSize: 15, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' },
  },
} as const;

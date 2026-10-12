import { defaultPalettes, themeTokens } from 'uitheme-rn';
import type { ThemePalette } from 'uitheme-rn';
import { webPalettes } from './web-palettes';

export { webColorTokens } from './web-palettes';

export const palettes = {
  ...webPalettes,
  forest: {
    label: 'Forest',
    light: {
      ...defaultPalettes.default.light,
      accent: '#216E46',
      onAccent: '#FFFFFF',
    },
    dark: {
      ...defaultPalettes.default.dark,
      accent: '#80D6A5',
      onAccent: '#082517',
    },
  },
  clay: {
    label: 'Clay',
    light: {
      ...defaultPalettes.default.light,
      accent: '#A44226',
      onAccent: '#FFFFFF',
    },
    dark: {
      ...defaultPalettes.default.dark,
      accent: '#FFA88D',
      onAccent: '#351007',
    },
  },
} satisfies Record<string, ThemePalette>;

export const tokens = themeTokens;

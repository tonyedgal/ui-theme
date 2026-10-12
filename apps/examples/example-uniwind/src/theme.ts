import type { ThemeStyleScopes } from 'uitheme-rn/uniwind';

export const palettes = {
  default: { label: 'Default' },
  supabase: { label: 'Supabase' },
  mono: { label: 'Mono' },
  caffeine: { label: 'Caffeine' },
  mocha: { label: 'Mocha' },
  perpetuity: { label: 'Perpetuity' },
};

export const scopes: ThemeStyleScopes = {
  default: { light: 'default-light', dark: 'default-dark' },
  supabase: { light: 'supabase-light', dark: 'supabase-dark' },
  mono: { light: 'mono-light', dark: 'mono-dark' },
  caffeine: { light: 'caffeine-light', dark: 'caffeine-dark' },
  mocha: { light: 'mocha-light', dark: 'mocha-dark' },
  perpetuity: { light: 'perpetuity-light', dark: 'perpetuity-dark' },
};

'use client';

import type { ReactNode } from 'react';
import { NextUIThemeProvider } from 'uitheme-web/next';
import { ThemeAnimationType } from 'uitheme-web/react';
import { IconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/icon-theme-toggle';
import { ColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-selector';

const paletteOptions = [
  { value: 'default', label: 'Default' },
  { value: 'bearnie', label: 'Bearnie' },
  { value: 'caffeine', label: 'Caffeine' },
  { value: 'mono', label: 'Mono' },
  { value: 'supabase', label: 'Supabase' },
];

const palettes = paletteOptions.map((option) => option.value);

export function SiteThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextUIThemeProvider colorThemes={palettes} defaultColorTheme="default">
      {children}
    </NextUIThemeProvider>
  );
}

export function SitePaletteSelector() {
  return (
    <ColorThemeSelector
      label="Site color theme"
      options={paletteOptions}
      className="min-w-0 max-w-full"
      classes={{
        label: 'sr-only',
        trigger:
          'h-7 w-28 min-w-0 max-w-full gap-2 border-0 bg-transparent px-2 py-1 text-xs shadow-none',
        content: 'site-palette-popup',
      }}
    />
  );
}

export function SiteAppearanceToggle() {
  return (
    <IconThemeToggle
      label="Toggle Theme"
      animationType={ThemeAnimationType.CIRCLE}
      duration={400}
      classes={{
        trigger:
          'size-11 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground',
      }}
    />
  );
}

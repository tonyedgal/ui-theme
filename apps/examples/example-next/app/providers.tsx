'use client';

import { NextUIThemeProvider } from 'ui-theme/react';

const COLOR_THEMES = [
  'default',
  'caffeine',
  'mono',
  'supabase',
  'mocha',
  'perpetuity',
];

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextUIThemeProvider colorThemes={COLOR_THEMES}>
      {children as React.ReactNode}
    </NextUIThemeProvider>
  );
}

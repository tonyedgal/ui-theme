'use client';

import { SiteThemeProvider } from '@/components/site-theme';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { DocsSearchDialog } from './search-dialog';

export function DocsProviders({ children }: { children: ReactNode }) {
  return (
    <SiteThemeProvider>
      <RootProvider
        theme={{ enabled: false }}
        search={{
          SearchDialog: DocsSearchDialog,
          hotKey: [
            {
              display: 'F',
              key: (event) => {
                if (
                  (event.metaKey || event.ctrlKey) &&
                  event.key.toLowerCase() === 'k'
                )
                  return true;

                if (
                  document.activeElement?.matches(
                    'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
                  )
                )
                  return false;

                return (
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.altKey &&
                  event.key.toLowerCase() === 'f'
                );
              },
            },
          ],
        }}
      >
        {children}
      </RootProvider>
    </SiteThemeProvider>
  );
}

import Link from 'next/link';
import {
  SitePaletteSelector,
  SiteAppearanceToggle,
} from '@/components/site-theme';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'UI-Theme',
    },
    themeSwitch: { enabled: false },
    links: [
      {
        type: 'custom',
        children: (
          <Link
            href="/docs"
            prefetch={false}
            className="text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            Documentation
          </Link>
        ),
      },
      {
        type: 'custom',
        children: (
          <div className="flex items-center gap-1">
            <SitePaletteSelector />
            <SiteAppearanceToggle />
          </div>
        ),
      },
    ],
    searchToggle: {
      enabled: false,
    },
    githubUrl: 'https://github.com/tonyedgal/ui-theme',
  };
}

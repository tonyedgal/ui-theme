'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Root } from 'fumadocs-core/page-tree';
import { getDocsNavigation } from '@/lib/docs-navigation';
import { componentBases } from '@/lib/component-docs';
import { useBrowserThemeColor } from '@/hooks/use-browser-theme-color';
import {
  DocsMobileNavigation,
  DocsSearch,
  DocsThemeToggle,
} from './docs/navigation';
import { SitePaletteSelector, SiteAppearanceToggle } from './site-theme';
import Icon, { IconNames } from './shared/icon';

export function SiteHeader({ tree }: { tree: Root }) {
  const pathname = usePathname();
  useBrowserThemeColor();
  const components = pathname.startsWith('/docs/components');

  const activeBase =
    componentBases.find((base) =>
      pathname.startsWith(`/docs/components/${base.name}/`)
    )?.name ?? 'base-ui';

  return (
    <header className="sticky top-0 z-40 w-full bg-background pt-[env(safe-area-inset-top)]">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-background px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:outline-2 focus:outline-ring"
      >
        Skip to content
      </a>
      <div className="relative mx-auto grid h-15 max-w-350 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] py-2 sm:px-[max(2rem,env(safe-area-inset-left),env(safe-area-inset-right))] lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          prefetch={false}
          aria-label="UI-Theme"
          className="w-24 max-w-full rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:w-28"
        >
          <Image
            src="/brand/wordmark-black-transparent.webp"
            alt=""
            width={1200}
            height={260}
            sizes="112px"
            className="h-auto w-full dark:hidden"
          />
          <Image
            src="/brand/wordmark-white-transparent.webp"
            alt=""
            width={1200}
            height={260}
            sizes="112px"
            className="hidden h-auto w-full dark:block"
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-center gap-6 text-sm lg:col-start-2 lg:row-start-1 lg:flex"
        >
          <Link
            href="/docs"
            prefetch={false}
            aria-current={
              pathname.startsWith('/docs') && !components ? 'page' : undefined
            }
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring aria-[current=page]:text-foreground motion-reduce:transition-none"
          >
            Docs
          </Link>
          <Link
            href="/docs/components"
            prefetch={false}
            aria-current={components ? 'page' : undefined}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring aria-[current=page]:text-foreground motion-reduce:transition-none"
          >
            Components
          </Link>
        </nav>
        <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-1 lg:col-start-3">
          <a
            href="https://github.com/tonyedgal/ui-theme"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden h-7 items-center justify-center rounded-md px-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring lg:inline-flex"
          >
            <Icon name={IconNames.github} w={14} h={14} />
          </a>
          <div className="hidden lg:block">
            <DocsSearch />
          </div>
          <div className="hidden lg:block">
            <SitePaletteSelector />
          </div>
          <div className="hidden lg:block">
            <DocsThemeToggle />
          </div>
          <div className="lg:hidden">
            <SiteAppearanceToggle />
          </div>
          <DocsMobileNavigation
            sections={getDocsNavigation(tree, activeBase)}
            pathname={pathname}
          />
        </div>
      </div>
    </header>
  );
}

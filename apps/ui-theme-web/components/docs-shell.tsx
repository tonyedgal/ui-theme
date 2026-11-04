'use client';

import { getDocsNavigation } from '@/lib/docs-navigation';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from 'fumadocs-ui/layouts/docs/slots/sidebar';
import { useTreeContext } from 'fumadocs-ui/contexts/tree';
import { componentBases } from '@/lib/component-docs';
import {
  DocsMobileNavigation,
  DocsSearch,
  DocsThemeToggle,
  SidebarNav,
} from './docs/navigation';
import { SitePaletteSelector } from './site-theme';
import Icon, { IconNames } from './shared/icon';

function navigationSections(tree: Root, pathname: string) {
  const activeBase =
    componentBases.find((base) =>
      pathname.startsWith(`/docs/components/${base.name}/`)
    )?.name ?? 'base-ui';

  return getDocsNavigation(tree, activeBase);
}

function DocsSidebar() {
  const { full: tree } = useTreeContext();
  const pathname = usePathname();
  const sections = navigationSections(tree, pathname);

  return (
    <aside
      id="nd-sidebar"
      className="fixed top-15 bottom-0 left-0 z-20 hidden w-62 overflow-y-auto bg-background text-sidebar-foreground md:block 2xl:left-[max(0px,calc((100vw-87.5rem)/2))]"
    >
      <SidebarNav sections={sections} pathname={pathname} />
    </aside>
  );
}

export function DocsShell({
  tree,
  children,
}: {
  tree: Root;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const sections = navigationSections(tree, pathname);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background">
        <div className="mx-auto flex max-w-350 items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link
            href="/"
            prefetch={false}
            className="flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap"
          >
            UI-Theme
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
            <a
              href="https://github.com/tonyedgal/ui-theme"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex h-7 items-center justify-center rounded-md px-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon name={IconNames.github} w={14} h={14} />
            </a>
            <DocsSearch />
            <SitePaletteSelector />
            <DocsThemeToggle />
            <DocsMobileNavigation sections={sections} pathname={pathname} />
          </div>
        </div>
      </header>
      <DocsLayout
        tree={tree}
        nav={{ enabled: false }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
        sidebar={{
          collapsible: false,
          prefetch: false,
        }}
        slots={{
          sidebar: {
            provider: SidebarProvider,
            root: DocsSidebar,
            trigger: SidebarTrigger,
            useSidebar,
          },
        }}
        containerProps={{
          className:
            'mx-auto w-full max-w-350 md:[--fd-sidebar-width:15.5rem] [--fd-toc-width:12rem] [--fd-banner-height:3.75rem]',
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}

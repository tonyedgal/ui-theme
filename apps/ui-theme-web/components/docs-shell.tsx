'use client';

import { getDocsNavigation } from '@/lib/docs-navigation';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from 'fumadocs-ui/layouts/docs/slots/sidebar';
import { useTreeContext } from 'fumadocs-ui/contexts/tree';
import { componentBases } from '@/lib/component-docs';
import { SidebarNav } from './docs/navigation';

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
      className="fixed top-[var(--site-header-height)] bottom-0 left-0 z-20 hidden w-62 overflow-y-auto bg-background text-sidebar-foreground lg:block 2xl:left-[max(0px,calc((100vw-87.5rem)/2))]"
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
  return (
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
          'mx-auto w-full max-w-350 lg:[--fd-sidebar-width:15.5rem] [--fd-toc-width:0px] xl:[--fd-toc-width:12rem] [--fd-banner-height:var(--site-header-height)]',
      }}
    >
      {children}
    </DocsLayout>
  );
}

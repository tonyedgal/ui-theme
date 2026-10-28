'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';

export function DocsShell({
  tree,
  children,
}: {
  tree: Root;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const activeBase =
    componentBases.find((base) =>
      pathname.startsWith(`/docs/components/${base.name}/`)
    )?.name ?? 'base-ui';

  const navigation: Root = {
    ...tree,
    children: [
      { type: 'separator', name: 'Getting started' },
      ...tree.children.filter(
        (node) => node.type !== 'page' || node.url !== '/docs/components'
      ),
      { type: 'separator', name: 'Components' },
      { type: 'page', name: 'Overview', url: '/docs/components' },
      ...componentDocs.map((doc) => ({
        type: 'page' as const,
        name: doc.title,
        url: componentDocUrl(activeBase, doc.name),
      })),
    ],
  };

  return (
    <>
      <header className="sticky top-0 z-40 hidden h-14 shrink-0 items-center gap-10 border-b bg-fd-background px-6 md:flex">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          UI-Theme
        </Link>
        <nav
          aria-label="Documentation navigation"
          className="flex items-center gap-6 text-sm"
        >
          <Link
            href="/docs"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Documentation
          </Link>
          <Link
            href="/docs/components"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Components
          </Link>
        </nav>
        <a
          href="https://github.com/tonyedgal/ui-theme"
          className="ml-auto text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </header>
      <DocsLayout
        tree={navigation}
        {...baseOptions()}
        nav={{ title: <span className="md:hidden">UI-Theme</span> }}
        sidebar={{
          collapsible: false,
          prefetch: false,
          className: 'bg-transparent',
          tabs: false,
        }}
        containerProps={{
          className:
            'md:[--fd-sidebar-width:240px] [--radius:0.625rem] md:[--fd-banner-height:3.5rem]',
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}

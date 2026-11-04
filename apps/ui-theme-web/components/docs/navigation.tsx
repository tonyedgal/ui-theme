'use client';

import { ThemeSwitcher } from '../../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-switcher';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { ChevronDown, Menu as MenuIcon, Search, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { cn } from '@/lib/utils';
import { SitePaletteSelector } from '@/components/site-theme';

import type { NavigationSection } from '@/lib/docs-navigation';

function subscribeNavigation(callback: () => void) {
  window.addEventListener('docs-navigation-change', callback);
  window.addEventListener('popstate', callback);

  return () => {
    window.removeEventListener('docs-navigation-change', callback);
    window.removeEventListener('popstate', callback);
  };
}

function readCollapsed() {
  try {
    return sessionStorage.getItem('docs-sidebar-collapsed');
  } catch {
    return null;
  }
}

export function SidebarNav({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavigationSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const stored = useSyncExternalStore(
    subscribeNavigation,
    readCollapsed,
    () => null
  );

  const search = useSyncExternalStore(
    subscribeNavigation,
    () => window.location.search,
    () => ''
  );

  const params = new URLSearchParams(search);
  const componentQuery = new URLSearchParams();

  for (const name of ['tailwind', 'language']) {
    const value = params.get(name);

    if (value) componentQuery.set(name, value);
  }

  const [fallback, setFallback] = useState<string[]>([]);
  let collapsed = fallback;

  try {
    const parsed: unknown = JSON.parse(stored ?? 'null');

    if (Array.isArray(parsed))
      collapsed = sections
        .filter((section) => parsed.includes(section.title))
        .map((section) => section.title);
  } catch {
    collapsed = fallback;
  }

  return (
    <nav aria-label="Documentation pages" className="space-y-8 px-6 py-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h4>
            <button
              type="button"
              aria-expanded={!collapsed.includes(section.title)}
              onClick={() => {
                const next = collapsed.includes(section.title)
                  ? collapsed.filter((x) => x !== section.title)
                  : [...collapsed, section.title];

                setFallback(next);

                try {
                  sessionStorage.setItem(
                    'docs-sidebar-collapsed',
                    JSON.stringify(next)
                  );
                  window.dispatchEvent(new Event('docs-navigation-change'));
                } catch {
                  return;
                }
              }}
              className="flex items-center gap-1 text-[11.2px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.title}
              <ChevronDown
                className={cn(
                  'size-3 transition-transform motion-reduce:transition-none',
                  collapsed.includes(section.title) && '-rotate-90'
                )}
                aria-hidden="true"
              />
            </button>
          </h4>
          <ul
            hidden={collapsed.includes(section.title)}
            className="mt-2 space-y-0.5"
          >
            {section.items.map((item, index) => (
              <li key={item.href}>
                {item.group &&
                  item.group !== section.items[index - 1]?.group && (
                    <h5 className="px-2.5 pt-5 pb-1.5 text-[11px] font-medium text-muted-foreground">
                      {item.group}
                    </h5>
                  )}
                <Link
                  href={
                    item.href.startsWith('/docs/components/') &&
                    componentQuery.size
                      ? `${item.href}?${componentQuery}`
                      : item.href
                  }
                  onClick={onNavigate}
                  prefetch={false}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className="flex min-w-0 w-fit items-center rounded-md px-2.5 py-1.5 [overflow-wrap:anywhere] [@media(pointer:coarse)]:min-h-11 text-xs text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export function DocsSearch({ onOpen }: { onOpen?: () => void }) {
  const { setOpenSearch } = useSearchContext();

  return (
    <button
      type="button"
      aria-label="Search documentation"
      onClick={() => {
        onOpen?.();
        setOpenSearch(true);
      }}
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Search className="size-3.5" aria-hidden="true" />
      <kbd className="inline-flex size-4.5 items-center justify-center rounded-xs border bg-muted text-[10px] font-medium">
        F
      </kbd>
    </button>
  );
}

export function DocsThemeToggle() {
  return <ThemeSwitcher label="Theme" />;
}

export function DocsMobileNavigation({
  sections,
  pathname,
}: {
  sections: NavigationSection[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Toggle menu"
        className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm lg:hidden" />
        <Dialog.Popup className="fixed top-[max(0.75rem,env(safe-area-inset-top))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-60 w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-xl border bg-background shadow-lg outline-none lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Dialog.Title className="font-semibold">UI-Theme</Dialog.Title>
            <Dialog.Close
              aria-label="Close menu"
              className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Site and documentation navigation
          </Dialog.Description>
          <div className="space-y-3 border-b px-4 pb-4">
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap gap-x-5"
            >
              <Link
                href="/docs"
                prefetch={false}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
              >
                Docs
              </Link>
              <Link
                href="/docs/components"
                prefetch={false}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
              >
                Components
              </Link>
            </nav>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DocsSearch onOpen={() => setOpen(false)} />
              <a
                href="https://github.com/tonyedgal/ui-theme"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                GitHub
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Color theme</span>
              <SitePaletteSelector />
            </div>
          </div>
          <SidebarNav
            sections={sections}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

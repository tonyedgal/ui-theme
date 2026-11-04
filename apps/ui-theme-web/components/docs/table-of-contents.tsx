'use client';

import { useActiveAnchor, type TOCItemType } from 'fumadocs-core/toc';
import { cn } from '@/lib/utils';

export function TableOfContents({ items }: { items: TOCItemType[] }) {
  const active = useActiveAnchor();

  return (
    <aside
      id="nd-toc"
      aria-label="On this page"
      className="sticky top-[var(--site-header-height)] hidden h-[calc(100dvh-var(--site-header-height))] w-48 shrink-0 flex-col self-start px-4 pt-8 pb-8 [grid-area:toc] xl:flex"
    >
      <p className="mb-3 text-sm font-medium text-foreground">On this page</p>
      <nav className="min-h-0 overflow-y-auto">
        <ul className="border-l">
          {items.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                aria-current={
                  active === item.url.slice(1) ? 'location' : undefined
                }
                className={cn(
                  'relative -ml-px block border-l-2 border-transparent py-1.5 pr-1 pl-3.5 text-xs text-muted-foreground transition-colors hover:text-foreground aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground',
                  item.depth > 2 && 'pl-6',
                  item.depth > 3 && 'pl-8'
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

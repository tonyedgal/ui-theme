'use client';

import type { ReactNode } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

export interface DocsTab {
  id: string;
  label: string;
  content: ReactNode;
}

export function DocsTabs({
  tabs,
  value,
  onValueChange,
  toolbar,
  leading,
  compact = false,
  className,
  label = 'Example views',
}: {
  tabs: DocsTab[];
  value?: string;
  onValueChange?: (value: string) => void;
  toolbar?: ReactNode;
  leading?: ReactNode;
  compact?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <Tabs.Root
      value={value}
      defaultValue={tabs[0]?.id}
      onValueChange={(next) => onValueChange?.(String(next))}
      className={cn('not-prose w-full min-w-0', className)}
    >
      <div
        className={cn(
          'flex min-w-0 items-center justify-between gap-2',
          compact && 'border-b bg-background px-4 py-2'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <Tabs.List
            aria-label={label}
            className="flex min-w-0 flex-wrap items-center gap-1"
          >
            {tabs.map((tab) => (
              <Tabs.Tab
                key={tab.id}
                value={tab.id}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-active:bg-muted data-active:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                  compact && 'px-2.5 py-1 text-xs'
                )}
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </div>
        {toolbar}
      </div>
      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.id}
          value={tab.id}
          className={cn('min-w-0 outline-none', !compact && 'mt-2')}
        >
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

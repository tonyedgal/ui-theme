'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ThemeAnimationType } from 'uitheme-web/react';
import { ThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-toggle';
import { IconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/icon-theme-toggle';
import { ThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-switcher';
import { ColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-selector';

function PreviewCard({
  name,
  title,
  children,
}: {
  name: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="min-w-0 rounded-[calc(var(--radius)+6px)] border border-border bg-card p-[5px]">
      <div
        role="group"
        aria-label={`${title} preview`}
        className="relative flex h-48 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/40 px-6"
      >
        {children}
      </div>
      <Link
        href={`/docs/components/base-ui/${name}`}
        prefetch={false}
        className="group mt-1 flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius)] px-3 text-sm font-medium outline-none hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        {title}
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
        />
      </Link>
    </article>
  );
}

export function LandingControls() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PreviewCard name="theme-toggle" title="Theme Toggle">
        <ThemeToggle
          display="icon-text"
          animationType={ThemeAnimationType.CIRCLE}
          duration={400}
        />
      </PreviewCard>
      <PreviewCard name="icon-theme-toggle" title="Icon Theme Toggle">
        <IconThemeToggle
          label="Toggle Theme"
          effect="blur"
          animationType={ThemeAnimationType.CIRCLE}
          duration={300}
        />
      </PreviewCard>
      <PreviewCard name="theme-switcher" title="Theme Switcher">
        <ThemeSwitcher
          label="Preview appearance"
          animationType={ThemeAnimationType.CIRCLE}
          duration={250}
        />
      </PreviewCard>
      <PreviewCard name="color-theme-selector" title="Color Theme Selector">
        <ColorThemeSelector
          label="Preview color palette"
          animationType={ThemeAnimationType.CIRCLE}
          duration={400}
          classes={{ root: 'w-44', label: 'sr-only' }}
        />
      </PreviewCard>
    </div>
  );
}

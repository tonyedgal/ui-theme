'use client';

import type { ReactNode } from 'react';
import { ThemeAnimationType } from 'uitheme-web/react';
import { PreviewCard as DogEarCard } from '@/components/ui/preview-card';
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
    <DogEarCard
      title={title}
      href={`/docs/components/base-ui/${name}`}
      className="min-w-0"
    >
      {children}
    </DogEarCard>
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

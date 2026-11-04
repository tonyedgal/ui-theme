'use client';

import { ThemeSelector } from './ui/theme/theme-selector';
import { ThemeToggle } from './ui/theme/theme-toggle';
import { ColorThemeSelector } from './ui/theme/color-theme-selector';

export function ThemeSection() {
  return (
    <section className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-3 md:p-6">
      <ThemeSelector />
      <div className="flex items-end">
        <ThemeToggle />
      </div>
      <ColorThemeSelector />
    </section>
  );
}

export default ThemeSection;

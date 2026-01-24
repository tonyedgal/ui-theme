'use client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SlideThemeToggle } from '@/components/theme/SlideThemeToggle';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { SlideDirection } from 'ui-theme/react';
import { useState } from 'react';

export function HooksDemo() {
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('left');

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Theme Animation Hooks
        </h2>
        <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
          Use the{' '}
          <code className="text-sm bg-muted px-2 py-1 rounded">useTheme</code>{' '}
          hook to create custom theme toggles with beautiful animations.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 p-4 md:p-6 rounded-lg border border-border bg-background/50 backdrop-blur-sm">
          <div className="flex gap-2 items-center justify-center">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Circle Theme:
            </label>
            <ThemeToggle />
          </div>

          <div className="flex gap-2 items-center justify-center">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Slide Theme:
            </label>
            <SlideThemeToggle slideDirection={slideDirection} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-background rounded-md w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Slide direction:
            </label>
            <Select
              value={slideDirection}
              onValueChange={(v) => setSlideDirection(v as SlideDirection)}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue>{slideDirection}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}

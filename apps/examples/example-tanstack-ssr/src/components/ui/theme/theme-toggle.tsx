'use client';

import * as React from 'react';
import type { Theme } from 'uitheme-web/react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from '@/lib/utils';
import * as TogglePrimitive from '@radix-ui/react-toggle';

export type ThemeToggleClasses = {
  root?: string;
  trigger?: string;
};

export type ThemeToggleProps = {
  className?: string;
  classes?: ThemeToggleClasses;
  label?: string;
  disabled?: boolean;
};

export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  ThemeToggleProps
>(function ThemeToggle(
  { className, classes, label = 'Toggle appearance', disabled = false },
  forwardedRef
) {
  const { resolvedTheme, switchTheme, mounted } = useUITheme();
  const target: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <div className={cn('inline-flex', classes?.root, className)}>
      <TogglePrimitive.Root
        ref={forwardedRef}
        type="button"
        aria-label={label}
        pressed={resolvedTheme === 'dark'}
        disabled={disabled || !mounted}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          classes?.trigger
        )}
        onClick={(event) =>
          void switchTheme(target, { element: event.currentTarget })
        }
      >
        {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
      </TogglePrimitive.Root>
    </div>
  );
});

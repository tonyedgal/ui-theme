'use client';

import * as React from 'react';
import type { Theme } from 'uitheme-web/react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from '@/lib/utils';
import { SunIcon, MoonIcon } from 'lucide-react';
import type { ThemeControlTransitionProps } from 'uitheme-web/react';
import * as TogglePrimitive from '@radix-ui/react-toggle';

export type ThemeToggleClasses = {
  root?: string;
  trigger?: string;
};

export type ThemeToggleProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'className' | 'children' | 'onClick' | 'value'
> &
  ThemeControlTransitionProps & {
    value?: string;
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    display?: 'text' | 'icon-text';
    borderStyle?: 'solid' | 'shadow';
    className?: string;
    classes?: ThemeToggleClasses;
    label?: string;
    disabled?: boolean;
  };

export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  ThemeToggleProps
>(function ThemeToggle(
  {
    animationType,
    duration,
    slideDirection,
    borderStyle = 'solid',
    display = 'text',
    className,
    classes,
    label,
    disabled = false,
    children,
    onClick,
    ...buttonProps
  },
  forwardedRef
) {
  const { resolvedTheme, switchTheme, mounted } = useUITheme();
  const target: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
  const Icon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  return (
    <div className={cn('inline-flex', classes?.root, className)}>
      <TogglePrimitive.Root
        {...buttonProps}
        ref={forwardedRef}
        type="button"
        data-border-style={borderStyle}
        aria-label={
          label ??
          (display === 'text'
            ? 'Toggle appearance'
            : `Switch to ${target} theme`)
        }
        pressed={resolvedTheme === 'dark'}
        disabled={disabled || !mounted}
        className={cn(
          'inline-flex h-10 gap-2 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
          'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:hover:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:focus-visible:shadow-[0_0_12px_color-mix(in_oklch,var(--shadow-border-focus)_18%,transparent),0_1px_3px_rgb(0_0_0_/_0.1),inset_0_0_0_2px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
          classes?.trigger
        )}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented)
            void switchTheme(target, {
              element: event.currentTarget,
              animationType,
              duration,
              slideDirection,
              animationOff: event.detail === 0,
            });
        }}
      >
        {children ?? (
          <>
            {display !== 'text' && (
              <Icon
                aria-hidden="true"
                focusable="false"
                className="size-4 shrink-0"
              />
            )}
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </>
        )}
      </TogglePrimitive.Root>
    </div>
  );
});

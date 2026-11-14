'use client';

import * as React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useUITheme } from 'uitheme-web/react';
import { ThemeToggle, type ThemeToggleProps } from './theme-toggle';
import { cn } from '@/lib/utils';
import type { ThemeControlTransitionProps } from 'uitheme-web/react';

export type IconThemeToggleProps = Omit<
  ThemeToggleProps,
  'display' | 'children' | 'animationType' | 'duration' | 'slideDirection'
> &
  ThemeControlTransitionProps & {
    effect?: 'rotate' | 'slide' | 'blur';
  };

export const IconThemeToggle = React.forwardRef<
  HTMLButtonElement,
  IconThemeToggleProps
>(function IconThemeToggle(
  { effect = 'rotate', label, classes, onKeyDown, onPointerDown, ...props },
  ref
) {
  const { resolvedTheme } = useUITheme();
  const [keyboard, setKeyboard] = React.useState(false);
  const dark = resolvedTheme === 'dark';

  const transition = keyboard
    ? 'transition-none motion-reduce:transition-none'
    : 'transition-[transform,translate,rotate,scale,opacity,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-100';

  const hidden = (side: 'sun' | 'moon') =>
    effect === 'slide'
      ? side === 'sun'
        ? '-translate-x-2'
        : 'translate-x-2'
      : effect === 'blur'
        ? 'scale-75 blur-[4px]'
        : side === 'sun'
          ? '-rotate-90 scale-75'
          : 'rotate-90 scale-75';

  const layer =
    'col-start-1 row-start-1 inline-flex size-4 items-center justify-center motion-reduce:!transform-none motion-reduce:!translate-x-0 motion-reduce:!rotate-0 motion-reduce:!scale-100 motion-reduce:!blur-none';

  return (
    <ThemeToggle
      {...props}
      ref={ref}
      label={label ?? `Switch to ${dark ? 'light' : 'dark'} theme`}
      onKeyDown={(event) => {
        setKeyboard(true);
        onKeyDown?.(event);
      }}
      onPointerDown={(event) => {
        setKeyboard(false);
        onPointerDown?.(event);
      }}
      classes={{
        ...classes,
        trigger: cn(
          'w-10 px-0 active:scale-[0.96] motion-reduce:active:scale-100',
          classes?.trigger
        ),
      }}
    >
      <span
        aria-hidden="true"
        data-effect={effect}
        className="grid size-4 overflow-hidden"
      >
        <span
          className={cn(
            layer,
            transition,
            dark ? cn('opacity-0', hidden('sun')) : 'opacity-100'
          )}
        >
          <SunIcon className="size-4" />
        </span>
        <span
          className={cn(
            layer,
            transition,
            dark ? 'opacity-100' : cn('opacity-0', hidden('moon'))
          )}
        >
          <MoonIcon className="size-4" />
        </span>
      </span>
    </ThemeToggle>
  );
});

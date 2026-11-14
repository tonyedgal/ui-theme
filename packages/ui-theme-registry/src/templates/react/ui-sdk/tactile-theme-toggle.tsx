'use client';

import * as React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import type { Theme, ThemeControlTransitionProps } from 'uitheme-web/react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from '@/lib/utils';
import { Switch, SwitchThumb } from '@ui-sdk/react/switch';

export type TactileThemeToggleClasses = {
  root?: string;
  track?: string;
  thumb?: string;
};

export type TactileThemeToggleProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  | 'className'
  | 'children'
  | 'onClick'
  | 'value'
  | 'role'
  | 'aria-checked'
  | 'name'
  | 'form'
  | 'defaultChecked'
  | 'defaultValue'
  | 'onChange'
  | 'onSelect'
> &
  ThemeControlTransitionProps & {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    classes?: TactileThemeToggleClasses;
    label?: string;
    disabled?: boolean;
  };

const icon =
  'col-start-1 row-start-1 size-[0.875em] transition-[transform,opacity,rotate,scale] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:!transform-none motion-reduce:!rotate-0 motion-reduce:!scale-100 motion-reduce:duration-[120ms]';

export const TactileThemeToggle = React.forwardRef<
  HTMLButtonElement,
  TactileThemeToggleProps
>(function TactileThemeToggle(
  {
    animationType,
    duration,
    slideDirection,
    className,
    classes,
    label = 'Dark theme',
    disabled = false,
    onClick,
    onKeyDown,
    ...buttonProps
  },
  forwardedRef
) {
  const { resolvedTheme, switchTheme, mounted } = useUITheme();
  const dark = resolvedTheme === 'dark';
  const target: Theme = dark ? 'light' : 'dark';

  return (
    <Switch
      {...buttonProps}
      ref={forwardedRef}
      checked={dark}
      aria-label={label}
      disabled={disabled || !mounted}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[0.5em] border border-border bg-muted p-[0.125em] text-[1.5em] shadow-sm outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 forced-colors:border-[ButtonText]',
        classes?.root,
        className
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);

        // the switch toggles on Space only; Enter toggles it too, as before.
        if (event.key === 'Enter' && !event.defaultPrevented) {
          event.preventDefault();

          if (!event.repeat) event.currentTarget.click();
        }
      }}
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
      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-[1.5em] w-[3em] items-center rounded-[0.375em] shadow-inner transition-colors duration-200 ease-out motion-reduce:duration-[120ms]',
          dark ? 'bg-primary' : 'bg-input',
          classes?.track
        )}
      >
        <SwitchThumb
          className={cn(
            'absolute left-[0.0625em] flex size-[1.375em] items-center justify-center rounded-[0.3125em] bg-background text-muted-foreground shadow-sm transition-[transform,translate] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform motion-reduce:duration-[120ms]',
            dark ? 'translate-x-[1.5em]' : 'translate-x-0',
            classes?.thumb
          )}
        >
          <span className="grid">
            <SunIcon
              focusable="false"
              strokeWidth={2.25}
              className={cn(
                icon,
                dark ? '-rotate-90 scale-50 opacity-0' : 'opacity-100'
              )}
            />
            <MoonIcon
              focusable="false"
              strokeWidth={2.25}
              className={cn(
                icon,
                dark ? 'opacity-100' : 'rotate-90 scale-50 opacity-0'
              )}
            />
          </span>
        </SwitchThumb>
      </span>
    </Switch>
  );
});

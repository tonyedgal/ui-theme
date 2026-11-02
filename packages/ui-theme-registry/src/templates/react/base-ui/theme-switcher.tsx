'use client';

import * as React from 'react';
import { useUITheme, type Theme } from 'uitheme-web/react';
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeControlTransitionProps } from 'uitheme-web/react';

export type ThemeSwitcherProps = ThemeControlTransitionProps & {
  label?: string;
  disabled?: boolean;
  borderStyle?: 'solid' | 'shadow';
  className?: string;
  classes?: {
    root?: string;
    item?: string;
    indicator?: string;
  };
};

const choices: readonly Theme[] = ['system', 'light', 'dark'];

export function ThemeSwitcher({
  label = 'Theme',
  disabled = false,
  animationType,
  duration,
  slideDirection,
  borderStyle = 'solid',
  className,
  classes,
}: ThemeSwitcherProps) {
  const { theme, themes, mounted, switchTheme } = useUITheme();
  const id = React.useId();
  const [keyboard, setKeyboard] = React.useState(false);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDownCapture={() => setKeyboard(true)}
      onPointerDownCapture={() => setKeyboard(false)}
      className={cn(
        'relative isolate inline-grid h-8 shrink-0 grid-cols-3 items-stretch rounded-[var(--radius)] border border-border bg-muted p-[var(--switcher-pad)] [--switcher-pad:calc(var(--spacing,0.25rem)/2)] [--switcher-inner-radius:max(0px,calc(var(--radius)-var(--switcher-pad)-1px))] [@media(pointer:coarse)]:h-11',
        'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
        classes?.root,
        className
      )}
      data-border-style={borderStyle}
    >
      <span
        aria-hidden="true"
        data-slot="selection-indicator"
        style={{ transform: `translateX(${choices.indexOf(theme) * 100}%)` }}
        className={cn(
          'pointer-events-none absolute bottom-[var(--switcher-pad)] left-[var(--switcher-pad)] top-[var(--switcher-pad)] -z-10 w-[calc((100%_-_var(--switcher-pad)_-_var(--switcher-pad))/3)] rounded-[var(--switcher-inner-radius)] bg-card border border-border motion-reduce:transition-none',
          keyboard
            ? 'transition-none'
            : 'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          classes?.indicator
        )}
      />
      {choices.map((value) => (
        <label
          key={value}
          data-checked={theme === value ? '' : undefined}
          className={cn(
            'relative flex min-w-8 cursor-pointer items-center justify-center rounded-[var(--switcher-inner-radius)] px-2 text-muted-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 data-[checked]:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground [@media(pointer:coarse)]:min-w-11',
            keyboard
              ? 'transition-none'
              : 'transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
            classes?.item
          )}
        >
          <input
            type="radio"
            name={id}
            value={value}
            checked={theme === value}
            aria-label={`${value[0]!.toUpperCase() + value.slice(1)} theme`}
            disabled={disabled || !mounted || !themes.includes(value)}
            className="peer absolute inset-0 z-10 m-0 size-full cursor-inherit opacity-0"
            onChange={(event) =>
              void switchTheme(value, {
                animationType,
                duration,
                slideDirection,
                animationOff: keyboard,
                element: event.currentTarget.closest('label'),
              })
            }
          />
          {React.createElement(
            value === 'light'
              ? SunIcon
              : value === 'dark'
                ? MoonIcon
                : MonitorIcon,
            { 'aria-hidden': true, className: 'size-4 shrink-0' }
          )}
        </label>
      ))}
    </div>
  );
}

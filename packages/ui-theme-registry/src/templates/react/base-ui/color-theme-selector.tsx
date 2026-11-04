'use client';

import * as React from 'react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from '@/lib/utils';
import type { ThemeControlTransitionProps } from 'uitheme-web/react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { Select } from '@base-ui/react/select';

export type ColorThemeOption = {
  value: string;
  label: string;
};

export type ColorThemeSelectorClasses = {
  root?: string;
  trigger?: string;
  content?: string;
  item?: string;
  label?: string;
};

export type ColorThemeSelectorProps = ThemeControlTransitionProps & {
  borderStyle?: 'solid' | 'shadow';
  className?: string;
  classes?: ColorThemeSelectorClasses;
  label?: string;
  options?: ColorThemeOption[];
  disabled?: boolean;
};

export const ColorThemeSelector = React.forwardRef<
  HTMLButtonElement,
  ColorThemeSelectorProps
>(function ColorThemeSelector(
  {
    animationType,
    duration,
    slideDirection,
    borderStyle = 'solid',
    className,
    classes,
    label = 'Color theme',
    options: optionOverrides,
    disabled = false,
  }: ColorThemeSelectorProps,
  forwardedRef
) {
  const { colorTheme, colorThemes, mounted, switchColorTheme } = useUITheme();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const selected = colorTheme;

  const options: {
    value: string;
    label: string;
  }[] =
    optionOverrides ??
    colorThemes.map((value) => ({
      value,
      label: value
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }));

  React.useImperativeHandle(forwardedRef, () => triggerRef.current!);

  const change = (
    value: string,
    element: HTMLElement | null = triggerRef.current
  ) =>
    switchColorTheme(value, {
      element,
      animationType,
      duration,
      slideDirection,
    });

  return (
    <div className={cn('flex flex-col gap-2', classes?.root, className)}>
      <Select.Root
        items={options}
        value={selected}
        disabled={disabled || !mounted}
        onValueChange={(next) => next && void change(next)}
      >
        <Select.Label
          className={cn('text-sm font-medium text-foreground', classes?.label)}
        >
          {label}
        </Select.Label>
        <Select.Trigger
          ref={triggerRef}
          disabled={disabled || !mounted}
          className={cn(
            'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[color,box-shadow,border-color] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
            'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight] data-[border-style=shadow]:hover:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:focus-visible:shadow-[0_0_12px_color-mix(in_oklch,var(--shadow-border-focus)_18%,transparent),0_1px_3px_rgb(0_0_0_/_0.1),inset_0_0_0_2px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)]',
            classes?.trigger
          )}
          data-border-style={borderStyle}
        >
          <Select.Value className="min-w-0 truncate text-left" />
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            alignItemWithTrigger={false}
            sideOffset={6}
            align="start"
          >
            <Select.Popup
              className={cn(
                'z-50 min-w-[var(--anchor-width)] max-h-[min(20rem,var(--available-height,20rem))] overflow-y-auto overscroll-contain rounded-[var(--radius)] border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none [scrollbar-width:thin]',
                'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
                classes?.content
              )}
              data-border-style={borderStyle}
            >
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'relative flex min-h-9 w-full cursor-default select-none items-center gap-2 rounded-[max(0px,calc(var(--radius)-4px))] py-2 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:bg-accent/60 data-[state=checked]:bg-accent/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                      classes?.item
                    )}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="absolute right-3 flex size-4 items-center justify-center">
                      <CheckIcon aria-hidden="true" className="size-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
});

'use client';

import * as React from 'react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from './classes';
import * as Select from '@radix-ui/react-select';

export type ColorThemeOption = { value: string; label: string };

export type ColorThemeSelectorClasses = {
  root?: string;
  trigger?: string;
  content?: string;
  item?: string;
  label?: string;
};

export type ColorThemeSelectorProps = {
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
  const id = React.useId();
  const selected = colorTheme;

  const options: { value: string; label: string }[] =
    optionOverrides ??
    colorThemes.map((value) => ({
      value,
      label: value
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }));

  React.useImperativeHandle(forwardedRef, () => triggerRef.current!);

  const change = (value: string) =>
    switchColorTheme(value, { element: triggerRef.current });

  return (
    <div className={cn('flex flex-col gap-2', classes?.root, className)}>
      <Select.Root
        value={selected}
        disabled={disabled || !mounted}
        onValueChange={(next) => void change(next)}
      >
        <label
          htmlFor={id}
          className={cn('text-sm font-medium text-foreground', classes?.label)}
        >
          {label}
        </label>
        <Select.Trigger
          ref={triggerRef}
          id={id}
          disabled={disabled || !mounted}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            classes?.trigger
          )}
        >
          <Select.Value />
          <Select.Icon aria-hidden="true">⌄</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            className={cn(
              'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none',
              classes?.content
            )}
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    classes?.item
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    ✓
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
});

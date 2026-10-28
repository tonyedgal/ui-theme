'use client';

import * as React from 'react';
import { useUITheme } from 'uitheme-web/react';
import { cn } from './classes';
import { Select } from '@base-ui/react/select';

export type AppearanceSelectorClasses = {
  root?: string;
  trigger?: string;
  content?: string;
  item?: string;
  label?: string;
};

export type AppearanceSelectorProps = {
  className?: string;
  classes?: AppearanceSelectorClasses;
  label?: string;
  disabled?: boolean;
};

export const AppearanceSelector = React.forwardRef<
  HTMLButtonElement,
  AppearanceSelectorProps
>(function AppearanceSelector(
  {
    className,
    classes,
    label = 'Appearance',
    disabled = false,
  }: AppearanceSelectorProps,
  forwardedRef
) {
  const { theme, themes, mounted, switchTheme } = useUITheme();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const selected = theme;

  const options: { value: string; label: string }[] = themes.map((value) => ({
    value,
    label: value
      .replaceAll('-', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

  React.useImperativeHandle(forwardedRef, () => triggerRef.current!);

  const change = (value: string) => {
    const next = themes.find((theme) => theme === value);

    if (next) void switchTheme(next, { element: triggerRef.current });
  };

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
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
            classes?.trigger
          )}
        >
          <Select.Value />
          <span aria-hidden="true">⌄</span>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup
              className={cn(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none',
                classes?.content
              )}
            >
              <Select.List>
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

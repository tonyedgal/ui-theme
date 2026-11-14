'use client';

import * as React from 'react';
import {
  useUITheme,
  type ThemeControlTransitionProps,
} from 'uitheme-web/react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@ui-sdk/react/collapsible';
import { Radio, RadioGroup, RadioIndicator } from '@ui-sdk/react/radio';

export type ColorThemeDisclosureProps = ThemeControlTransitionProps & {
  label?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  maxHeight?: number;
  direction?: 'up' | 'down';

  options?: readonly { value: string; label: string }[];
  className?: string;
  classes?: Partial<
    Record<'root' | 'trigger' | 'content' | 'item' | 'label', string>
  >;
};

export const ColorThemeDisclosure = React.forwardRef<
  HTMLButtonElement,
  ColorThemeDisclosureProps
>(function ColorThemeDisclosure(
  {
    label = 'Color theme',
    disabled = false,
    open,
    defaultOpen = false,
    onOpenChange,
    maxHeight = 240,
    direction = 'down',
    options: optionOverrides,
    animationType,
    duration,
    slideDirection,
    className,
    classes,
  },
  ref
) {
  const { colorTheme, colorThemes, mounted, switchColorTheme } = useUITheme();
  const id = React.useId();
  const groupRef = React.useRef<HTMLDivElement>(null);

  const options =
    optionOverrides?.filter((option) => colorThemes.includes(option.value)) ??
    colorThemes.map((value) => ({
      value,
      label: value
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }));

  const selected = options.find((option) => option.value === colorTheme);

  const style: React.CSSProperties & { '--disclosure-max-height': string } = {
    '--disclosure-max-height': `${maxHeight}px`,
  };

  return (
    <div
      data-direction={direction}
      className={cn(
        'flex min-w-0 flex-col gap-2 data-[direction=up]:flex-col-reverse',
        classes?.root,
        className
      )}
    >
      <span
        id={id}
        className={cn('text-sm font-medium text-foreground', classes?.label)}
      >
        {label}
      </span>
      <Collapsible
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next) => onOpenChange?.(next)}
        disabled={disabled || !mounted}
        data-direction={direction}
        className="flex flex-col data-[direction=up]:flex-col-reverse min-w-0 [--disclosure-padding:var(--spacing,0.25rem)] rounded-[calc(var(--radius)+var(--disclosure-padding))] bg-muted p-[var(--disclosure-padding)] ring-1 ring-inset ring-border"
      >
        <CollapsibleTrigger
          ref={ref}
          id={`${id}-trigger`}
          disabled={disabled || !mounted}
          className={cn(
            'group flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-left text-sm font-medium text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            classes?.trigger
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="sr-only">{label}: </span>
            <span className="truncate">{selected?.label ?? colorTheme}</span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              'size-4 shrink-0',
              direction === 'up'
                ? 'rotate-180 group-data-[open]:rotate-0'
                : 'group-data-[open]:rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsiblePanel
          keepMounted
          data-direction={direction}
          role="region"
          aria-labelledby={`${id}-trigger`}
          tabIndex={0}
          style={style}
          className={cn(
            'max-h-[min(var(--disclosure-max-height),60svh)] overflow-auto overscroll-contain rounded-b-[var(--radius)] data-[direction=up]:rounded-t-[var(--radius)] data-[direction=up]:rounded-b-none p-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]',
            classes?.content
          )}
        >
          <RadioGroup
            ref={groupRef}
            aria-labelledby={id}
            value={colorTheme}
            disabled={disabled || !mounted}
            onValueChange={(value) => {
              const next = colorThemes.find((item) => item === value);

              if (next)
                void switchColorTheme(next, {
                  element:
                    groupRef.current
                      ?.querySelectorAll('[data-slot="radio"]')
                      .item(
                        options.findIndex((option) => option.value === next)
                      )
                      ?.closest('label') ?? null,
                  animationType,
                  duration,
                  slideDirection,
                });
            }}
          >
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[max(0px,calc(var(--radius)-2px))] px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring has-[[data-checked]]:bg-accent has-[[data-checked]]:text-accent-foreground has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-50',
                  classes?.item
                )}
              >
                <Radio
                  value={option.value}
                  className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-muted-foreground bg-background outline-none data-[checked]:border-primary data-[checked]:bg-primary"
                >
                  <RadioIndicator className="size-1.5 rounded-full bg-primary-foreground" />
                </Radio>
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </CollapsiblePanel>
      </Collapsible>
    </div>
  );
});

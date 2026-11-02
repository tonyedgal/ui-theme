'use client';

import * as React from 'react';
import {
  useUITheme,
  type ThemeControlTransitionProps,
} from 'uitheme-web/react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const expanded = open ?? internalOpen;
  const id = React.useId();

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
      <div
        data-direction={direction}
        className="flex flex-col data-[direction=up]:flex-col-reverse min-w-0 [--disclosure-padding:var(--spacing,0.25rem)] rounded-[calc(var(--radius)+var(--disclosure-padding))] bg-muted p-[var(--disclosure-padding)] ring-1 ring-inset ring-border"
      >
        <button
          ref={ref}
          id={`${id}-trigger`}
          type="button"
          disabled={disabled || !mounted}
          aria-expanded={expanded}
          aria-controls={`${id}-content`}
          onClick={() => {
            if (open === undefined) setInternalOpen(!expanded);
            onOpenChange?.(!expanded);
          }}
          className={cn(
            'flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-left text-sm font-medium text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
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
              (direction === 'up' ? !expanded : expanded) && 'rotate-180'
            )}
          />
        </button>
        <div
          id={`${id}-content`}
          data-direction={direction}
          hidden={!expanded}
          role="region"
          aria-labelledby={`${id}-trigger`}
          tabIndex={0}
          style={style}
          className={cn(
            'max-h-[min(var(--disclosure-max-height),60svh)] overflow-auto overscroll-contain rounded-b-[var(--radius)] data-[direction=up]:rounded-t-[var(--radius)] data-[direction=up]:rounded-b-none p-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]',
            classes?.content
          )}
        >
          <fieldset
            disabled={disabled || !mounted}
            aria-labelledby={id}
            className="m-0 min-w-0 border-0 p-0"
          >
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[max(0px,calc(var(--radius)-2px))] px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
                  classes?.item
                )}
              >
                <input
                  type="radio"
                  name={id}
                  value={option.value}
                  checked={colorTheme === option.value}
                  onChange={(event) => {
                    const next = colorThemes.find(
                      (value) => value === option.value
                    );

                    if (next)
                      void switchColorTheme(next, {
                        element: event.currentTarget.closest('label'),
                        animationType,
                        duration,
                        slideDirection,
                      });
                  }}
                  className="size-3.5 shrink-0 accent-primary"
                />

                {option.label}
              </label>
            ))}
          </fieldset>
        </div>
      </div>
    </div>
  );
});

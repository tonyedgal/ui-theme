'use client';

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scroll regions need keyboard focus */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type SourceDisclosureClasses = {
  root?: string;
  trigger?: string;
  content?: string;
};

export type SourceDisclosureProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  maxHeight?: number;

  className?: string;
  classes?: SourceDisclosureClasses;
};

export const SourceDisclosure = React.forwardRef<
  HTMLButtonElement,
  SourceDisclosureProps
>(function SourceDisclosure(
  {
    title,
    children,
    open,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    maxHeight = 384,
    className,
    classes,
  },
  ref
) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const expanded = open ?? internalOpen;
  const id = React.useId();

  const contentStyle: React.CSSProperties & {
    '--disclosure-max-height': string;
  } = { '--disclosure-max-height': `${maxHeight}px` };

  return (
    <div
      className={cn(
        'min-w-0 [--disclosure-padding:var(--spacing,0.25rem)] rounded-[calc(var(--radius)+var(--disclosure-padding))] bg-muted p-[var(--disclosure-padding)] ring-1 ring-inset ring-border',

        classes?.root,
        className
      )}
    >
      <button
        ref={ref}
        id={`${id}-trigger`}
        type="button"
        disabled={disabled}
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
        <span className="min-w-0 break-words">{title}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className={cn('size-4 shrink-0', expanded ? 'rotate-180' : undefined)}
        >
          <path
            d="m3 6 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <section
        id={`${id}-content`}
        hidden={!expanded}
        aria-labelledby={`${id}-trigger`}
        tabIndex={0}
        style={contentStyle}
        className={cn(
          'max-h-[min(var(--disclosure-max-height),60svh)] overflow-auto overscroll-contain rounded-b-[var(--radius)] p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]',
          classes?.content
        )}
      >
        {children}
      </section>
    </div>
  );
});

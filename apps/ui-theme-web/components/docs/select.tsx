'use client';

import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

export function DocsSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <Select.Root
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <Select.Label className="text-xs text-muted-foreground">
          {label}
        </Select.Label>
        <Select.Trigger className="flex min-h-9 min-w-17 max-w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-input bg-background px-3 text-sm leading-5 text-foreground outline-none transition-[color,border-color,box-shadow] hover:bg-accent/40 aria-expanded:border-ring focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none">
          <Select.Value className="min-w-0 flex-1 truncate text-left" />
          <Select.Icon className="pointer-events-none flex shrink-0 items-center text-muted-foreground">
            <ChevronDown className="size-4" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            alignItemWithTrigger={false}
            align="start"
            sideOffset={6}
            className="z-70"
          >
            <Select.Popup className="min-w-[var(--anchor-width)] max-w-[var(--available-width)] max-h-[min(18rem,var(--available-height,18rem))] overflow-y-auto overscroll-contain rounded-[var(--radius)] border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none [scrollbar-width:thin]">
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex min-h-9 cursor-default select-none items-center rounded-[max(0px,calc(var(--radius)-4px))] py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:bg-accent/60"
                  >
                    <Select.ItemText className="min-w-0 [overflow-wrap:anywhere]">
                      {option.label}
                    </Select.ItemText>
                    <Select.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                      <Check className="size-4" aria-hidden="true" />
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
}

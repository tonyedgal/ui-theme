'use client';

import { ThemeAnimationType, DEFAULT_DURATION } from 'uitheme-web/react';
import { cn } from './classes';
import { Slider } from '@base-ui/react/slider';
import { Select } from '@base-ui/react/select';

export type TransitionSettingsValue = {
  animationType: ThemeAnimationType;
  duration: number;
};

export type TransitionSettingsClasses = {
  root?: string;
  trigger?: string;
  content?: string;
  item?: string;
  label?: string;
  track?: string;
  thumb?: string;
};

export type TransitionSettingsProps = {
  value: TransitionSettingsValue;
  onValueChange: (value: TransitionSettingsValue) => void;
  className?: string;
  classes?: TransitionSettingsClasses;
  animationLabel?: string;
  durationLabel?: string;
  disabled?: boolean;
};

const animationTypes = [
  ThemeAnimationType.CIRCLE,
  ThemeAnimationType.BLUR_CIRCLE,
  ThemeAnimationType.SLIDE,
  ThemeAnimationType.CLIP_PATH,
  ThemeAnimationType.POLYGON_GRADIENT,
  ThemeAnimationType.TRIANGLE,
];

export function TransitionSettings({
  value,
  onValueChange,
  className,
  classes,
  animationLabel = 'Transition animation',
  durationLabel = 'Transition duration',
  disabled = false,
}: TransitionSettingsProps) {
  return (
    <div className={cn('flex flex-col gap-4', classes?.root, className)}>
      <Select.Root
        items={animationTypes.map((value) => ({
          value,
          label: value.replaceAll('-', ' '),
        }))}
        disabled={disabled}
        value={value.animationType}
        onValueChange={(animationType) =>
          animationType &&
          onValueChange({
            ...value,
            animationType:
              animationTypes.find((type) => type === animationType) ??
              ThemeAnimationType.CIRCLE,
          })
        }
      >
        <Select.Label
          className={cn('text-sm font-medium text-foreground', classes?.label)}
        >
          {animationLabel}
        </Select.Label>
        <Select.Trigger
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                {animationTypes.map((type) => (
                  <Select.Item
                    key={type}
                    value={type}
                    className={cn(
                      'cursor-default rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                      classes?.item
                    )}
                  >
                    <Select.ItemText>
                      {type
                        .replaceAll('-', ' ')
                        .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <label
        className={cn(
          'flex flex-col gap-2 text-sm font-medium text-foreground',
          classes?.label
        )}
      >
        <span className="flex items-center justify-between">
          <span>{durationLabel}</span>
          <output aria-live="polite">{value.duration} ms</output>
        </span>
        <Slider.Root
          disabled={disabled}
          value={value.duration}
          min={0}
          max={2000}
          step={50}
          onValueChange={(duration) =>
            onValueChange({ ...value, duration: Number(duration) })
          }
          className="flex w-full flex-col gap-2"
        >
          <Slider.Control className="flex h-5 items-center">
            <Slider.Track
              className={cn(
                'relative h-2 w-full rounded-full bg-muted',
                classes?.track
              )}
            >
              <Slider.Indicator className="absolute h-full rounded-full bg-primary" />
              <Slider.Thumb
                aria-label={durationLabel}
                className={cn(
                  'block size-4 rounded-full border border-primary bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                  classes?.thumb
                )}
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <span className="sr-only">Default {DEFAULT_DURATION} milliseconds</span>
      </label>
    </div>
  );
}

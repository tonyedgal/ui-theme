<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { shallowRef, useTemplateRef } from 'vue';
import { useUITheme, type Theme } from 'uitheme-web/vue';
import { SunIcon, MoonIcon, MonitorIcon } from '@lucide/vue';
import { cn } from '@/lib/utils';
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from '@ui-sdk/vue/segmented-control';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      label?: string;
      disabled?: boolean;
      borderStyle?: 'solid' | 'shadow';
      class?: string;
      classes?: {
        root?: string;
        item?: string;
        indicator?: string;
      };
    }
  >(),
  {
    duration: undefined,
    slideDirection: undefined,
    borderStyle: 'solid',
    class: undefined,
    classes: undefined,
    label: 'Theme',
  }
);

const theme = useUITheme(() => ({
  animationType: props.animationType,
  duration: props.duration,
  slideDirection: props.slideDirection,
}));

const choices: readonly Theme[] = ['system', 'light', 'dark'];

const keyboard = shallowRef(false);

const root = useTemplateRef<{ $el: HTMLElement }>('root');

function change(value: string | null) {
  const next = choices.find((choice) => choice === value);

  if (next)
    void theme.switchTheme(next, {
      animationOff: keyboard.value,
      element:
        root.value?.$el.querySelectorAll(
          '[data-slot="segmented-control-item"]'
        )[choices.indexOf(next)] ?? null,
    });
}
</script>
<template>
  <SegmentedControl
    ref="root"
    :aria-label="label"
    :value="theme.theme.value"
    :disabled="disabled || !theme.mounted.value"
    :data-border-style="borderStyle"
    :class="
      cn(
        'relative isolate inline-grid h-8 shrink-0 grid-cols-3 items-stretch rounded-[var(--radius)] border border-border bg-muted p-[var(--switcher-pad)] [--switcher-pad:calc(var(--spacing,0.25rem)/2)] [--switcher-inner-radius:max(0px,calc(var(--radius)-var(--switcher-pad)-1px))] [@media(pointer:coarse)]:h-11',
        'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
        props.classes?.root,
        props.class
      )
    "
    @value-change="change"
    @keydown.capture="keyboard = true"
    @pointerdown.capture="keyboard = false"
  >
    <SegmentedControlIndicator
      aria-hidden="true"
      :class="
        cn(
          'pointer-events-none absolute bottom-[var(--switcher-pad)] left-[var(--segmented-control-indicator-left)] top-[var(--switcher-pad)] -z-10 w-[var(--segmented-control-indicator-width)] rounded-[var(--switcher-inner-radius)] bg-card border border-border motion-reduce:transition-none',
          keyboard
            ? 'transition-none'
            : 'transition-[left,width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          props.classes?.indicator
        )
      "
    />
    <SegmentedControlItem
      v-for="value in choices"
      :key="value"
      :value="value"
      :disabled="!theme.themes.includes(value)"
      :class="
        cn(
          'relative flex min-w-8 cursor-pointer items-center justify-center rounded-[var(--switcher-inner-radius)] px-2 text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[checked]:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground [@media(pointer:coarse)]:min-w-11',
          keyboard
            ? 'transition-none'
            : 'transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
          props.classes?.item
        )
      "
    >
      <component
        :is="
          value === 'light'
            ? SunIcon
            : value === 'dark'
              ? MoonIcon
              : MonitorIcon
        "
        aria-hidden="true"
        class="size-4 shrink-0"
      />
      <span class="sr-only">{{
        `${value[0]!.toUpperCase() + value.slice(1)} theme`
      }}</span>
    </SegmentedControlItem>
  </SegmentedControl>
</template>

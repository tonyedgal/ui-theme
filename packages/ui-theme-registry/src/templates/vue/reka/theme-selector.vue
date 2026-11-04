<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { SunIcon, MoonIcon, MonitorIcon } from '@lucide/vue';
import { CheckIcon, ChevronDownIcon } from '@lucide/vue';
import { computed, useTemplateRef, useId } from 'vue';
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectViewport,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import { useUITheme } from 'uitheme-web/vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      display?: 'text' | 'icon-text';
      borderStyle?: 'solid' | 'shadow';
      class?: string;
      classes?: Partial<
        Record<
          'root' | 'trigger' | 'content' | 'item' | 'label' | 'track' | 'thumb',
          string
        >
      >;
      disabled?: boolean;
      label?: string;
    }
  >(),
  {
    duration: undefined,
    slideDirection: undefined,
    display: 'text',
    label: 'Theme',
    borderStyle: 'solid',
    class: undefined,
    classes: undefined,
  }
);

const theme = useUITheme(() => ({
  animationType: props.animationType,
  duration: props.duration,
  slideDirection: props.slideDirection,
}));

const trigger = useTemplateRef<InstanceType<typeof SelectTrigger>>('trigger');

const id = useId();

const rootClass = computed(() =>
  cn('inline-flex flex-col gap-1', props.class, props.classes?.['root'])
);

const triggerClass = computed(() =>
  cn(
    cn(
      'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[color,box-shadow,border-color] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
      'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight] data-[border-style=shadow]:hover:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:focus-visible:shadow-[0_0_12px_color-mix(in_oklch,var(--shadow-border-focus)_18%,transparent),0_1px_3px_rgb(0_0_0_/_0.1),inset_0_0_0_2px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)]'
    ),
    props.classes?.['trigger']
  )
);

const contentClass = computed(() =>
  cn(
    cn(
      'z-50 min-w-[max(10rem,var(--reka-select-trigger-width))] max-h-[min(20rem,var(--reka-select-content-available-height,20rem))] overflow-y-auto overscroll-contain rounded-[var(--radius)] border border-border bg-popover p-1 text-popover-foreground shadow-md [scrollbar-width:thin]',
      'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]'
    ),
    props.classes?.['content']
  )
);

const itemClass = computed(() =>
  cn(
    'relative flex min-h-9 w-full cursor-default select-none items-center gap-2 rounded-[max(0px,calc(var(--radius)-4px))] py-2 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:bg-accent/60 data-[state=checked]:bg-accent/60 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    props.classes?.['item']
  )
);

function select(value: AcceptableValue, origin?: HTMLElement | null) {
  const selected = theme.themes.find((option) => option === value);
  const element = origin ?? trigger.value?.$el;

  if (selected)
    void theme.switchTheme(selected, {
      element: element instanceof HTMLElement ? element : null,
    });
}
</script>

<template>
  <div :class="rootClass">
    <label
      :for="id"
      :class="
        cn('text-sm font-medium text-foreground', props.classes?.['label'])
      "
      >{{ label }}</label
    >
    <SelectRoot
      :model-value="theme.theme.value"
      :disabled="disabled || !theme.mounted.value"
      @update:model-value="select"
    >
      <SelectTrigger
        :id="id"
        ref="trigger"
        :data-border-style="borderStyle"
        :class="triggerClass"
        :aria-label="label"
        ><component
          :is="
            theme.theme.value === 'light'
              ? SunIcon
              : theme.theme.value === 'dark'
                ? MoonIcon
                : MonitorIcon
          "
          v-if="display !== 'text'"
          aria-hidden="true"
          class="size-4 shrink-0" /><SelectValue
          class="min-w-0 flex-1 truncate text-left" /><ChevronDownIcon
          aria-hidden="true"
          class="size-4 shrink-0 text-muted-foreground"
      /></SelectTrigger>
      <SelectPortal>
        <SelectContent
          :data-border-style="borderStyle"
          :class="contentClass"
          position="popper"
          :side-offset="6"
        >
          <SelectViewport
            ><SelectItem
              v-for="option in theme.themes"
              :key="option"
              :value="option"
              :class="itemClass"
              ><component
                :is="
                  option === 'light'
                    ? SunIcon
                    : option === 'dark'
                      ? MoonIcon
                      : MonitorIcon
                "
                v-if="display !== 'text'"
                aria-hidden="true"
                class="size-4 shrink-0" /><SelectItemText>{{
                option[0]!.toUpperCase() + option.slice(1)
              }}</SelectItemText
              ><SelectItemIndicator
                class="absolute right-3 flex size-4 items-center justify-center"
                ><CheckIcon
                  aria-hidden="true"
                  class="size-4" /></SelectItemIndicator></SelectItem
          ></SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

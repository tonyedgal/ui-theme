<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { SunIcon, MoonIcon } from '@lucide/vue';
import { Toggle } from 'reka-ui';
import { computed } from 'vue';
import { useUITheme } from 'uitheme-web/vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      display?: 'text' | 'icon-text';
      disabled?: boolean;
      borderStyle?: 'solid' | 'shadow';
      class?: string;
      classes?: Partial<
        Record<
          'root' | 'trigger' | 'content' | 'item' | 'label' | 'track' | 'thumb',
          string
        >
      >;
      label?: string;
      lightLabel?: string;
      darkLabel?: string;
    }
  >(),
  {
    duration: undefined,
    slideDirection: undefined,
    display: 'text',
    borderStyle: 'solid',
    class: undefined,
    classes: undefined,
    label: undefined,
    lightLabel: 'Switch to light theme',
    darkLabel: 'Switch to dark theme',
  }
);

const theme = useUITheme(() => ({
  animationType: props.animationType,
  duration: props.duration,
  slideDirection: props.slideDirection,
}));

const target = computed(() =>
  theme.resolvedTheme.value === 'dark' ? 'light' : 'dark'
);

const text = computed(() =>
  target.value === 'light' ? props.lightLabel : props.darkLabel
);

const rootClass = computed(() =>
  cn('inline-flex', props.class, props.classes?.['root'])
);

const triggerClass = computed(() =>
  cn(
    'inline-flex h-10 gap-2 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:hover:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:focus-visible:shadow-[0_0_12px_color-mix(in_oklch,var(--shadow-border-focus)_18%,transparent),0_1px_3px_rgb(0_0_0_/_0.1),inset_0_0_0_2px_color-mix(in_oklch,var(--shadow-border-focus)_55%,transparent)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
    props.classes?.['trigger']
  )
);
</script>

<template>
  <div :class="rootClass">
    <Toggle
      :model-value="theme.resolvedTheme.value === 'dark'"
      type="button"
      :data-border-style="borderStyle"
      :class="triggerClass"
      :aria-label="label ?? (display === 'text' ? 'Toggle theme' : text)"
      :disabled="disabled || !theme.mounted.value"
      @click="theme.switchTheme(target, $event)"
    >
      <slot>
        <component
          :is="theme.resolvedTheme.value === 'dark' ? MoonIcon : SunIcon"
          v-if="display !== 'text'"
          aria-hidden="true"
          focusable="false"
          class="size-4 shrink-0"
        />
        <span>{{ text }}</span>
      </slot>
    </Toggle>
  </div>
</template>

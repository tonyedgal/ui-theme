<script setup lang="ts">
import { Toggle } from 'reka-ui';
import { computed } from 'vue';
import { useUITheme } from 'uitheme-web/vue';
import { mergeClasses, type ControlClasses } from './classes';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    class?: string;
    classes?: ControlClasses;
    label?: string;
    lightLabel?: string;
    darkLabel?: string;
  }>(),
  {
    class: undefined,
    classes: undefined,
    label: 'Toggle theme',
    lightLabel: 'Switch to light theme',
    darkLabel: 'Switch to dark theme',
  }
);

const theme = useUITheme();

const target = computed(() =>
  theme.resolvedTheme.value === 'dark' ? 'light' : 'dark'
);

const text = computed(() =>
  target.value === 'light' ? props.lightLabel : props.darkLabel
);

const rootClass = computed(() =>
  mergeClasses('inline-flex', props.class, props.classes, 'root')
);

const triggerClass = computed(() =>
  mergeClasses(
    'inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    undefined,
    props.classes,
    'trigger'
  )
);
</script>

<template>
  <div :class="rootClass">
    <Toggle
      :model-value="theme.resolvedTheme.value === 'dark'"
      type="button"
      :class="triggerClass"
      :aria-label="label"
      :disabled="disabled || !theme.mounted.value"
      @click="
        theme.switchTheme(target, {
          element: $event.currentTarget as HTMLElement,
        })
      "
    >
      {{ text }}
    </Toggle>
  </div>
</template>

<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { shallowRef } from 'vue';
import { SunIcon, MoonIcon } from '@lucide/vue';
import { useUITheme } from 'uitheme-web/vue';
import ThemeToggle from './theme-toggle.vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      effect?: 'rotate' | 'slide' | 'blur';
      label?: string;
      disabled?: boolean;
      borderStyle?: 'solid' | 'shadow';
      class?: string;
      classes?: Partial<
        Record<
          'root' | 'trigger' | 'content' | 'item' | 'label' | 'track' | 'thumb',
          string
        >
      >;
    }
  >(),
  {
    duration: undefined,
    slideDirection: undefined,
    borderStyle: 'solid',
    class: undefined,
    classes: undefined,
    label: undefined,
    effect: 'rotate',
  }
);

const theme = useUITheme();

const keyboard = shallowRef(false);

const layer =
  'col-start-1 row-start-1 inline-flex size-4 items-center justify-center motion-reduce:!transform-none motion-reduce:!translate-x-0 motion-reduce:!rotate-0 motion-reduce:!scale-100 motion-reduce:!blur-none';

function hidden(side: 'sun' | 'moon') {
  return props.effect === 'slide'
    ? side === 'sun'
      ? '-translate-x-2'
      : 'translate-x-2'
    : props.effect === 'blur'
      ? 'scale-75 blur-[4px]'
      : side === 'sun'
        ? '-rotate-90 scale-75'
        : 'rotate-90 scale-75';
}
</script>
<template>
  <ThemeToggle
    v-bind="props"
    :class="props.class"
    :label="
      label ??
      `Switch to ${theme.resolvedTheme.value === 'dark' ? 'light' : 'dark'} theme`
    "
    :classes="{
      ...props.classes,
      trigger: cn(
        'w-10 px-0 active:scale-[0.96] motion-reduce:active:scale-100',
        props.classes?.trigger
      ),
    }"
    @keydown.capture="keyboard = true"
    @pointerdown.capture="keyboard = false"
  >
    <span
      aria-hidden="true"
      :data-effect="effect"
      class="grid size-4 overflow-hidden"
    >
      <span
        :class="[
          layer,
          keyboard
            ? 'transition-none motion-reduce:transition-none'
            : 'transition-[transform,translate,rotate,scale,opacity,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-100',
          theme.resolvedTheme.value === 'dark'
            ? ['opacity-0', hidden('sun')]
            : 'opacity-100',
        ]"
        ><SunIcon class="size-4"
      /></span>
      <span
        :class="[
          layer,
          keyboard
            ? 'transition-none motion-reduce:transition-none'
            : 'transition-[transform,translate,rotate,scale,opacity,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-100',
          theme.resolvedTheme.value === 'dark'
            ? 'opacity-100'
            : ['opacity-0', hidden('moon')],
        ]"
        ><MoonIcon class="size-4"
      /></span>
    </span>
  </ThemeToggle>
</template>

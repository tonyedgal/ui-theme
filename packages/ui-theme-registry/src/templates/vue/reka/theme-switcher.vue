<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { useId, shallowRef } from 'vue';
import { useUITheme, type Theme } from 'uitheme-web/vue';
import { SunIcon, MoonIcon, MonitorIcon } from '@lucide/vue';
import { cn } from '@/lib/utils';

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

const id = useId();

const keyboard = shallowRef(false);
</script>
<template>
  <div
    :data-border-style="borderStyle"
    role="radiogroup"
    :aria-label="label"
    :class="
      cn(
        'relative isolate inline-grid h-8 shrink-0 grid-cols-3 items-stretch rounded-[var(--radius)] border border-border bg-muted p-[var(--switcher-pad)] [--switcher-pad:calc(var(--spacing,0.25rem)/2)] [--switcher-inner-radius:max(0px,calc(var(--radius)-var(--switcher-pad)-1px))] [@media(pointer:coarse)]:h-11',
        cn(
          'data-[border-style=shadow]:[--shadow-border-edge:theme(colors.border)] data-[border-style=shadow]:[--shadow-border-focus:theme(colors.ring)] data-[border-style=shadow]:border-transparent data-[border-style=shadow]:focus-visible:border-transparent data-[border-style=shadow]:ring-0 data-[border-style=shadow]:focus-visible:ring-0 data-[border-style=shadow]:shadow-[0_0_4px_rgb(0_0_0_/_0.25),inset_0_0_0_1px_var(--shadow-border-edge)] data-[border-style=shadow]:forced-colors:outline data-[border-style=shadow]:forced-colors:outline-1 data-[border-style=shadow]:forced-colors:outline-[CanvasText] data-[border-style=shadow]:forced-colors:focus-visible:outline-2 data-[border-style=shadow]:forced-colors:focus-visible:outline-[Highlight]',
          cn(props.classes?.root ?? '', props.class)
        )
      )
    "
    @keydown.capture="keyboard = true"
    @pointerdown.capture="keyboard = false"
  >
    <span
      aria-hidden="true"
      data-slot="selection-indicator"
      :style="{
        transform: `translateX(${choices.indexOf(theme.theme.value) * 100}%)`,
      }"
      :class="
        cn(
          'pointer-events-none absolute bottom-[var(--switcher-pad)] left-[var(--switcher-pad)] top-[var(--switcher-pad)] -z-10 w-[calc((100%_-_var(--switcher-pad)_-_var(--switcher-pad))/3)] rounded-[var(--switcher-inner-radius)] bg-card border border-border motion-reduce:transition-none',
          cn(
            keyboard
              ? 'transition-none'
              : 'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
            props.classes?.indicator
          )
        )
      "
    />
    <label
      v-for="value in choices"
      :key="value"
      :data-checked="theme.theme.value === value ? '' : undefined"
      :class="
        cn(
          'relative flex min-w-8 cursor-pointer items-center justify-center rounded-[var(--switcher-inner-radius)] px-2 text-muted-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 data-[checked]:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground [@media(pointer:coarse)]:min-w-11',
          cn(
            keyboard
              ? 'transition-none'
              : 'transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
            props.classes?.item
          )
        )
      "
    >
      <input
        type="radio"
        :name="id"
        :value="value"
        :checked="theme.theme.value === value"
        :aria-label="`${value[0]!.toUpperCase() + value.slice(1)} theme`"
        :disabled="
          disabled || !theme.mounted.value || !theme.themes.includes(value)
        "
        class="peer absolute inset-0 z-10 m-0 size-full cursor-inherit opacity-0"
        @change="
          theme.switchTheme(value, {
            animationOff: keyboard,
            element: ($event.currentTarget as HTMLElement).closest('label'),
          })
        "
      />
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
    </label>
  </div>
</template>

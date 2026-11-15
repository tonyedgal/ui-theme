<script setup lang="ts">
import type { ThemeControlTransitionProps } from 'uitheme-web/vue';
import { computed } from 'vue';
import { SunIcon, MoonIcon } from '@lucide/vue';
import { useUITheme } from 'uitheme-web/vue';
import { cn } from '@/lib/utils';
import { Switch, SwitchThumb } from '@ui-sdk/vue/switch';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      label?: string;
      disabled?: boolean;
      class?: string;
      classes?: Partial<Record<'root' | 'track' | 'thumb', string>>;
    }
  >(),
  {
    duration: undefined,
    slideDirection: undefined,
    class: undefined,
    classes: undefined,
    label: 'Dark theme',
  }
);

const icon =
  'col-start-1 row-start-1 size-[0.875em] transition-[transform,opacity,rotate,scale] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:!transform-none motion-reduce:!rotate-0 motion-reduce:!scale-100 motion-reduce:duration-[120ms]';

const theme = useUITheme(() => ({
  animationType: props.animationType,
  duration: props.duration,
  slideDirection: props.slideDirection,
}));

const dark = computed(() => theme.resolvedTheme.value === 'dark');

const rootClass = computed(() =>
  cn(
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[0.5em] border border-border bg-muted p-[0.125em] text-[1.5em] shadow-sm outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 forced-colors:border-[ButtonText]',
    props.classes?.root,
    props.class
  )
);

const trackClass = computed(() =>
  cn(
    'relative flex h-[1.5em] w-[3em] items-center rounded-[0.375em] shadow-inner transition-colors duration-200 ease-out motion-reduce:duration-[120ms]',
    dark.value ? 'bg-primary' : 'bg-input',
    props.classes?.track
  )
);

const thumbClass = computed(() =>
  cn(
    'absolute left-[0.0625em] flex size-[1.375em] items-center justify-center rounded-[0.3125em] bg-background text-muted-foreground shadow-sm transition-[transform,translate] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform motion-reduce:duration-[120ms]',
    dark.value ? 'translate-x-[1.5em]' : 'translate-x-0',
    props.classes?.thumb
  )
);

// the switch toggles on Space only; Enter toggles it too, as before.
function onEnter(event: KeyboardEvent) {
  event.preventDefault();

  if (!event.repeat && event.currentTarget instanceof HTMLElement)
    event.currentTarget.click();
}
</script>

<template>
  <Switch
    :checked="dark"
    :aria-label="label"
    :disabled="disabled || !theme.mounted.value"
    :class="rootClass"
    @keydown.enter="onEnter"
    @click="theme.switchTheme(dark ? 'light' : 'dark', $event)"
  >
    <span aria-hidden="true" :class="trackClass">
      <SwitchThumb :class="thumbClass">
        <span class="grid">
          <SunIcon
            focusable="false"
            :stroke-width="2.25"
            :class="[
              icon,
              dark ? '-rotate-90 scale-50 opacity-0' : 'opacity-100',
            ]"
          />
          <MoonIcon
            focusable="false"
            :stroke-width="2.25"
            :class="[
              icon,
              dark ? 'opacity-100' : 'rotate-90 scale-50 opacity-0',
            ]"
          />
        </span>
      </SwitchThumb>
    </span>
  </Switch>
</template>

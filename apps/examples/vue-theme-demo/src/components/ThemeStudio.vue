<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import {
  UIThemeSwitcher,
  UIThemeSelector,
  useUITheme,
  ThemeAnimationType,
  TRANSITION_DIRECTIONS,
  type SlideDirection,
  type AnimationPosition,
  type TransitionOptions,
} from 'uitheme-vue';

const effect = shallowRef(ThemeAnimationType.CIRCLE);

const duration = shallowRef(600);

const slideDirection = shallowRef<SlideDirection>('left');

const position = shallowRef<AnimationPosition>('trigger');

const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#34a85a" d="M50 0 100 50 50 100 0 50z"/><path fill="white" d="M50 26 74 50 50 74 26 50z"/></svg>')}`;

const emit = defineEmits<{
  'update:settings': [settings: TransitionOptions];
}>();

const settings = computed(() => ({
  animationType: effect.value,
  duration: duration.value,
  slideDirection: slideDirection.value,
  animationPosition: position.value,
  logo,
}));

watch(settings, (value) => emit('update:settings', value), { immediate: true });

const { toggleTheme, mounted } = useUITheme(settings);

const effects = Object.values(ThemeAnimationType);
</script>

<template>
  <section aria-labelledby="studio-heading" class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="grid gap-2">
        <p
          class="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
        >
          01 / Playground
        </p>
        <h2 id="studio-heading" class="text-3xl font-semibold tracking-tight">
          Theme studio
        </h2>
      </div>
      <button
        type="button"
        class="bg-primary! text-primary-foreground!"
        :disabled="!mounted"
        @click="toggleTheme($event)"
      >
        Preview transition
      </button>
    </div>
    <div class="grid gap-6 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-3">
      <label class="grid gap-2 text-sm"
        >Appearance<UIThemeSwitcher :disabled="!mounted"
      /></label>
      <label class="grid gap-2 text-sm"
        >Light / dark only<UIThemeSwitcher
          label="Light or dark"
          :themes="['light', 'dark']"
          :disabled="!mounted"
      /></label>
      <label class="grid gap-2 text-sm"
        >Color theme<UIThemeSelector :disabled="!mounted"
      /></label>
      <label class="grid gap-2 text-sm"
        >Transition style<select v-model="effect" aria-label="Transition style">
          <option v-for="value in effects" :key="value" :value="value">
            {{ value }}
          </option>
        </select></label
      >
      <label class="grid gap-2 text-sm"
        >Slide direction<select
          v-model="slideDirection"
          aria-label="Slide direction"
        >
          <option
            v-for="value in TRANSITION_DIRECTIONS"
            :key="value"
            :value="value"
          >
            {{ value }}
          </option>
        </select></label
      >
      <label class="grid gap-2 text-sm"
        >Animation origin<select
          v-model="position"
          aria-label="Animation origin"
        >
          <option
            v-for="value in ['trigger', 'center', ...TRANSITION_DIRECTIONS]"
            :key="value"
            :value="value"
          >
            {{ value }}
          </option>
        </select></label
      >
      <label class="grid gap-2 text-sm sm:col-span-2 lg:col-span-3"
        >Duration: {{ duration }} ms<input
          v-model.number="duration"
          aria-label="Transition duration"
          type="range"
          min="0"
          max="2000"
          step="50"
          class="w-full accent-primary"
      /></label>
    </div>
    <p class="text-sm text-muted-foreground">
      Preview changes light and dark mode. Palettes animate from the selected
      tile. Reduced motion uses an immediate change.
    </p>
  </section>
</template>

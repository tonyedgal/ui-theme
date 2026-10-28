<script setup lang="ts">
import { computed } from 'vue';
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectViewport,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import { ThemeAnimationType } from 'uitheme-web/core';
import { DEFAULT_DURATION } from 'uitheme-web/core';
import { mergeClasses, type ControlClasses } from './classes';

export interface TransitionSettingsValue {
  animationType: ThemeAnimationType;
  duration: number;
}

const props = withDefaults(
  defineProps<{
    modelValue?: TransitionSettingsValue;
    disabled?: boolean;
    class?: string;
    classes?: ControlClasses;
    animationLabel?: string;
    durationLabel?: string;
  }>(),
  {
    disabled: false,
    class: undefined,
    classes: undefined,
    modelValue: () => ({
      animationType: ThemeAnimationType.CIRCLE,
      duration: DEFAULT_DURATION,
    }),
    animationLabel: 'Transition effect',
    durationLabel: 'Duration',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: TransitionSettingsValue];
}>();

const animationTypes = [
  ThemeAnimationType.CIRCLE,
  ThemeAnimationType.BLUR_CIRCLE,
  ThemeAnimationType.SLIDE,
  ThemeAnimationType.CLIP_PATH,
  ThemeAnimationType.POLYGON_GRADIENT,
  ThemeAnimationType.TRIANGLE,
];

const duration = computed(() =>
  Math.min(2000, Math.max(0, Math.round(props.modelValue.duration / 50) * 50))
);

const rootClass = computed(() =>
  mergeClasses('flex w-full flex-col gap-4', props.class, props.classes, 'root')
);

const triggerClass = computed(() =>
  mergeClasses(
    'inline-flex min-w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    undefined,
    props.classes,
    'trigger'
  )
);

const contentClass = computed(() =>
  mergeClasses(
    'z-50 min-w-48 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
    undefined,
    props.classes,
    'content'
  )
);

const itemClass = computed(() =>
  mergeClasses(
    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
    undefined,
    props.classes,
    'item'
  )
);

const trackClass = computed(() =>
  mergeClasses(
    'relative h-2 w-full grow overflow-hidden rounded-full bg-secondary',
    undefined,
    props.classes,
    'track'
  )
);

const thumbClass = computed(() =>
  mergeClasses(
    'block size-4 rounded-full border border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    undefined,
    props.classes,
    'thumb'
  )
);

function update(patch: Partial<TransitionSettingsValue>) {
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

function updateAnimation(value: AcceptableValue) {
  const selected = animationTypes.find((type) => type === value);

  if (selected) update({ animationType: selected });
}

function updateDuration(value: number[] | undefined) {
  const next = value?.[0];

  if (next !== undefined) update({ duration: next });
}
</script>

<template>
  <div :class="rootClass">
    <div class="flex flex-col gap-2">
      <label
        :class="
          mergeClasses(
            'text-sm font-medium text-foreground',
            undefined,
            props.classes,
            'label'
          )
        "
        >{{ animationLabel }}</label
      >
      <SelectRoot
        :disabled="disabled"
        :model-value="modelValue.animationType"
        @update:model-value="updateAnimation"
      >
        <SelectTrigger :class="triggerClass" :aria-label="animationLabel"
          ><SelectValue
        /></SelectTrigger>
        <SelectPortal
          ><SelectContent :class="contentClass" position="popper"
            ><SelectViewport
              ><SelectItem
                v-for="type in animationTypes"
                :key="type"
                :value="type"
                :class="itemClass"
                ><SelectItemText>{{
                  type
                    .split('-')
                    .map((part) => part[0]!.toUpperCase() + part.slice(1))
                    .join(' ')
                }}</SelectItemText></SelectItem
              ></SelectViewport
            ></SelectContent
          ></SelectPortal
        >
      </SelectRoot>
    </div>
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-4">
        <label
          :class="
            mergeClasses(
              'text-sm font-medium text-foreground',
              undefined,
              props.classes,
              'label'
            )
          "
          >{{ durationLabel }}</label
        >
        <output
          class="text-sm tabular-nums text-muted-foreground"
          aria-live="polite"
          >{{ duration }} ms</output
        >
      </div>
      <SliderRoot
        :disabled="disabled"
        class="relative flex w-full touch-none select-none items-center"
        :model-value="[duration]"
        :min="0"
        :max="2000"
        :step="50"
        :aria-label="durationLabel"
        @update:model-value="updateDuration"
      >
        <SliderTrack :class="trackClass"
          ><SliderRange class="absolute h-full bg-primary"
        /></SliderTrack>
        <SliderThumb
          :aria-label="durationLabel"
          :class="thumbClass"
          :aria-valuetext="`${duration} milliseconds`"
        />
      </SliderRoot>
    </div>
  </div>
</template>

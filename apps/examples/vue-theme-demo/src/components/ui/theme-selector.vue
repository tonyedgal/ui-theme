<script setup lang="ts">
import { computed, useTemplateRef, useId } from 'vue';
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectViewport,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import { useUITheme } from 'uitheme-web/vue';
import { mergeClasses, type ControlClasses } from './classes';

const props = withDefaults(
  defineProps<{
    class?: string;
    classes?: ControlClasses;
    disabled?: boolean;
    label?: string;
  }>(),
  { label: 'Theme', class: undefined, classes: undefined }
);

const theme = useUITheme();

const trigger = useTemplateRef<InstanceType<typeof SelectTrigger>>('trigger');

const id = useId();

const rootClass = computed(() =>
  mergeClasses('inline-flex flex-col gap-1', props.class, props.classes, 'root')
);

const triggerClass = computed(() =>
  mergeClasses(
    'inline-flex min-w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    undefined,
    props.classes,
    'trigger'
  )
);

const contentClass = computed(() =>
  mergeClasses(
    'z-50 min-w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
    undefined,
    props.classes,
    'content'
  )
);

const itemClass = computed(() =>
  mergeClasses(
    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    undefined,
    props.classes,
    'item'
  )
);

function select(value: AcceptableValue) {
  const selected = theme.themes.find((option) => option === value);
  const element = trigger.value?.$el;

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
        mergeClasses(
          'text-sm font-medium text-foreground',
          undefined,
          props.classes,
          'label'
        )
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
        :class="triggerClass"
        :aria-label="label"
        ><SelectValue
      /></SelectTrigger>
      <SelectPortal>
        <SelectContent :class="contentClass" position="popper" :side-offset="4">
          <SelectViewport
            ><SelectItem
              v-for="option in theme.themes"
              :key="option"
              :value="option"
              :class="itemClass"
              ><SelectItemText>{{
                option[0]!.toUpperCase() + option.slice(1)
              }}</SelectItemText></SelectItem
            ></SelectViewport
          >
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId } from 'vue';
import { useUITheme, type ThemeControlTransitionProps } from 'uitheme-web/vue';
import { ChevronDownIcon } from '@lucide/vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    ThemeControlTransitionProps & {
      label?: string;
      disabled?: boolean;
      open?: boolean;
      defaultOpen?: boolean;
      maxHeight?: number;
      direction?: 'up' | 'down';

      options?: readonly { value: string; label: string }[];
      class?: string;
      classes?: Partial<
        Record<'root' | 'trigger' | 'content' | 'item' | 'label', string>
      >;
    }
  >(),
  {
    label: 'Color theme',
    disabled: false,
    open: undefined,
    defaultOpen: false,
    maxHeight: 240,
    direction: 'down',
    duration: undefined,
    slideDirection: undefined,
    options: undefined,
    class: undefined,
    classes: undefined,
  }
);

const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const state = useUITheme(() => ({
  animationType: props.animationType,
  duration: props.duration,
  slideDirection: props.slideDirection,
}));

const internalOpen = shallowRef(props.defaultOpen);

const expanded = computed(() => props.open ?? internalOpen.value);

const id = useId();

const options = computed(
  () =>
    props.options?.filter((option) =>
      state.colorThemes.includes(option.value)
    ) ??
    state.colorThemes.map((value) => ({
      value,
      label: value
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }))
);

const selected = computed(() =>
  options.value.find((option) => option.value === state.colorTheme.value)
);

function toggle() {
  if (props.open === undefined) internalOpen.value = !expanded.value;
  emit(
    'update:open',
    props.open === undefined ? internalOpen.value : !expanded.value
  );
}

function select(value: string, event: Event) {
  const next = state.colorThemes.find((option) => option === value);

  if (next)
    void state.switchColorTheme(next, {
      element:
        event.currentTarget instanceof HTMLElement
          ? event.currentTarget.closest('label')
          : null,
    });
}
</script>

<template>
  <div
    :data-direction="direction"
    :class="
      cn(
        'flex min-w-0 flex-col gap-2 data-[direction=up]:flex-col-reverse',
        props.classes?.root,
        props.class
      )
    "
  >
    <span
      :id="id"
      :class="cn('text-sm font-medium text-foreground', props.classes?.label)"
      >{{ label }}</span
    >
    <div
      :data-direction="direction"
      class="flex flex-col data-[direction=up]:flex-col-reverse min-w-0 [--disclosure-padding:var(--spacing,0.25rem)] rounded-[calc(var(--radius)+var(--disclosure-padding))] bg-muted p-[var(--disclosure-padding)] ring-1 ring-inset ring-border"
    >
      <button
        :id="`${id}-trigger`"
        type="button"
        :disabled="disabled || !state.mounted.value"
        :aria-expanded="expanded"
        :aria-controls="`${id}-content`"
        :class="
          cn(
            'flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-card px-3 py-2 text-left text-sm font-medium text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            props.classes?.trigger
          )
        "
        @click="toggle"
      >
        <span class="flex min-w-0 items-center gap-2"
          ><span class="sr-only">{{ label }}: </span>

          <slot name="value" :value="state.colorTheme.value"
            ><span class="truncate">{{
              selected?.label ?? state.colorTheme.value
            }}</span></slot
          >
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          :class="
            cn(
              'size-4 shrink-0',
              (direction === 'up' ? !expanded : expanded) && 'rotate-180'
            )
          "
        />
      </button>
      <div
        :id="`${id}-content`"
        :data-direction="direction"
        :hidden="!expanded"
        role="region"
        :aria-labelledby="`${id}-trigger`"
        tabindex="0"
        :style="{ '--disclosure-max-height': `${maxHeight}px` }"
        :class="
          cn(
            'max-h-[min(var(--disclosure-max-height),60svh)] overflow-auto overscroll-contain rounded-b-[var(--radius)] data-[direction=up]:rounded-t-[var(--radius)] data-[direction=up]:rounded-b-none p-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [scrollbar-width:thin] [scrollbar-color:var(--muted-foreground)_transparent]',
            props.classes?.content
          )
        "
      >
        <fieldset
          :disabled="disabled || !state.mounted.value"
          :aria-labelledby="id"
          class="m-0 min-w-0 border-0 p-0"
        >
          <label
            v-for="option in options"
            :key="option.value"
            :class="
              cn(
                'flex cursor-pointer items-center gap-3 rounded-[max(0px,calc(var(--radius)-2px))] px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
                props.classes?.item
              )
            "
          >
            <input
              type="radio"
              :name="id"
              :value="option.value"
              :checked="state.colorTheme.value === option.value"
              class="size-3.5 shrink-0 accent-primary"
              @change="select(option.value, $event)"
            />

            <slot name="option" :option="option">{{ option.label }}</slot>
          </label>
        </fieldset>
      </div>
    </div>
  </div>
</template>

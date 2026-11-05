<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useId } from 'vue';

const props = defineProps<{
  label: string;
  value: string;
  options: readonly string[];
  disabled?: boolean;
}>();

const emit = defineEmits<{ select: [value: string, element: HTMLElement] }>();

const open = shallowRef(false);

const trigger = shallowRef<HTMLButtonElement | null>(null);

const id = useId();

const title = (value: string) => value[0]!.toUpperCase() + value.slice(1);

function choose(value: string) {
  open.value = false;

  if (trigger.value) emit('select', value, trigger.value);
}

function close(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

onMounted(() => document.addEventListener('keydown', close));

onBeforeUnmount(() => document.removeEventListener('keydown', close));
</script>

<template>
  <div class="select">
    <button
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-label="props.label"
      :aria-expanded="open"
      :aria-controls="id"
      :disabled="props.disabled"
      @click="open = !open"
    >
      {{ title(props.value) }}
    </button>
    <ul v-if="open" :id="id" role="listbox">
      <li
        v-for="option in props.options"
        :key="option"
        role="option"
        :aria-selected="option === props.value"
        @click="choose(option)"
      >
        {{ title(option) }}
      </li>
    </ul>
  </div>
</template>

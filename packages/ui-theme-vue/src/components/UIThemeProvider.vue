<script setup lang="ts">
import { onMounted, onScopeDispose, provide } from 'vue';
import { createThemeController } from '../controller';
import { themeKey } from '../context';
import type { UIThemeOptions } from '../types';

const props = defineProps<{ options?: UIThemeOptions }>();

const controller = createThemeController(props.options);

provide(themeKey, controller);

onMounted(controller.mount);

onScopeDispose(controller.dispose);
</script>

<template>
  <slot />
</template>

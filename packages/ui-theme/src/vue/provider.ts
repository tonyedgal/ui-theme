import {
  defineComponent,
  onMounted,
  onScopeDispose,
  provide,
  watch,
} from 'vue';
import { createVueThemeController } from './controller';
import { themeKey } from './context';
import type { UIThemeOptions } from './types';

export const UIThemeProvider = defineComponent(
  (props: { options?: UIThemeOptions }, { slots }) => {
    const instance = createVueThemeController(props.options);
    provide(themeKey, instance);
    watch(
      () => props.options,
      (options) => instance.updateOptions(options ?? {}),
      { deep: true }
    );
    onMounted(instance.mount);
    onScopeDispose(instance.dispose);

    return () => slots.default?.();
  },
  {
    name: 'UIThemeProvider',
    props: { options: { type: Object, default: () => ({}) } },
  }
);

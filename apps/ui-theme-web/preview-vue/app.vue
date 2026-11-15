<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useUITheme } from 'uitheme-web/vue';
import RekaThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/reka/theme-toggle.vue';
import RekaThemeSelector from '../../../packages/ui-theme-registry/src/templates/vue/reka/theme-selector.vue';
import RekaColorThemeSelector from '../../../packages/ui-theme-registry/src/templates/vue/reka/color-theme-selector.vue';
import RekaIconThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/reka/icon-theme-toggle.vue';
import RekaTactileThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/reka/tactile-theme-toggle.vue';
import RekaThemeSwitcher from '../../../packages/ui-theme-registry/src/templates/vue/reka/theme-switcher.vue';
import RekaThemeDisclosure from '../../../packages/ui-theme-registry/src/templates/vue/reka/theme-disclosure.vue';
import RekaColorThemeDisclosure from '../../../packages/ui-theme-registry/src/templates/vue/reka/color-theme-disclosure.vue';
import SdkThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/theme-toggle.vue';
import SdkThemeSelector from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/theme-selector.vue';
import SdkColorThemeSelector from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/color-theme-selector.vue';
import SdkIconThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/icon-theme-toggle.vue';
import SdkTactileThemeToggle from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/tactile-theme-toggle.vue';
import SdkThemeSwitcher from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/theme-switcher.vue';
import SdkThemeDisclosure from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/theme-disclosure.vue';
import SdkColorThemeDisclosure from '../../../packages/ui-theme-registry/src/templates/vue/ui-sdk/color-theme-disclosure.vue';
import { componentDocs, componentExamples } from '@/lib/component-docs';
import {
  readPreviewMessage,
  type PreviewMessage,
  type PreviewState,
} from '../lib/vue-preview-protocol';

const props = defineProps<{
  post: (message: PreviewMessage) => void;
  params: Record<string, string>;
}>();

const sets = {
  reka: {
    'theme-toggle': RekaThemeToggle,
    'theme-selector': RekaThemeSelector,
    'color-theme-selector': RekaColorThemeSelector,
    'icon-theme-toggle': RekaIconThemeToggle,
    'tactile-theme-toggle': RekaTactileThemeToggle,
    'theme-switcher': RekaThemeSwitcher,
    'theme-disclosure': RekaThemeDisclosure,
    'color-theme-disclosure': RekaColorThemeDisclosure,
  },
  'ui-sdk-vue': {
    'theme-toggle': SdkThemeToggle,
    'theme-selector': SdkThemeSelector,
    'color-theme-selector': SdkColorThemeSelector,
    'icon-theme-toggle': SdkIconThemeToggle,
    'tactile-theme-toggle': SdkTactileThemeToggle,
    'theme-switcher': SdkThemeSwitcher,
    'theme-disclosure': SdkThemeDisclosure,
    'color-theme-disclosure': SdkColorThemeDisclosure,
  },
};

const set = props.params.base === 'reka' ? sets.reka : sets['ui-sdk-vue'];

const label = props.params.base === 'reka' ? 'Reka' : 'UI SDK';

const doc = componentDocs.find((item) => item.name === props.params.component);

const control = doc ? set[doc.name] : undefined;

const example = doc
  ? componentExamples(doc).find((item) => item.id === props.params.example)
  : undefined;

const transition = example?.animationType
  ? {
      animationType: 'slide' as const,
      duration: example.duration,
      slideDirection: example.slideDirection,
    }
  : {};

const borderStyle = example?.borderStyle ?? 'solid';

const display = example?.display ?? 'text';

const controlProps = computed(() => {
  switch (doc?.name) {
    case 'theme-toggle':
    case 'theme-selector':
      return { ...transition, borderStyle, display };
    case 'color-theme-selector':
    case 'theme-switcher':
      return { ...transition, borderStyle };
    case 'theme-disclosure':
      return { ...transition, display, direction: example?.direction };
    case 'color-theme-disclosure':
      return { ...transition, direction: example?.direction };
    case 'icon-theme-toggle':
      return { ...transition, borderStyle, effect: example?.effect };
    default:
      return transition;
  }
});

const centered = [
  'theme-toggle',
  'icon-theme-toggle',
  'tactile-theme-toggle',
  'theme-switcher',
].includes(doc?.name ?? '');

// selectors open a popup inside the frame, so they reserve room for it
const reserved =
  doc?.category === 'disclosures'
    ? `flex h-96 flex-col ${example?.direction === 'up' ? 'justify-end' : 'justify-start'}`
    : doc?.category === 'selectors'
      ? 'h-64'
      : '';

// decorative: one dot per theme token, painted by the active palette
const swatches = [
  'bg-background',
  'bg-foreground',
  'bg-primary',
  'bg-secondary',
  'bg-accent',
  'bg-muted',
  'bg-border',
];

const ui = useUITheme();

const root = useTemplateRef<HTMLElement>('root');

let observer: ResizeObserver | undefined;

let latest: PreviewState | undefined;

let waiting: MutationObserver | undefined;

const attribute = 'data-ui-theme-transition';

function apply() {
  if (!latest) return;
  const { theme, colorTheme } = latest;
  latest = undefined;

  if (theme !== ui.theme.value) ui.setTheme(theme);

  if (colorTheme !== ui.colorTheme.value) ui.setColorTheme(colorTheme);
}

function onMessage(event: MessageEvent) {
  if (event.origin !== location.origin || event.source !== window.parent)
    return;
  const message = readPreviewMessage(event.data);

  if (message?.type !== 'uitheme-preview:state') return;

  latest = message;

  // a running transition owns the theme; apply the last state once it ends
  if (document.documentElement.hasAttribute(attribute)) {
    if (waiting) return;
    waiting = new MutationObserver(() => {
      if (document.documentElement.hasAttribute(attribute)) return;
      waiting?.disconnect();
      waiting = undefined;
      apply();
    });
    waiting.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [attribute],
    });

    return;
  }

  apply();
}

onMounted(() => {
  window.addEventListener('message', onMessage);

  observer = new ResizeObserver(() => {
    if (root.value)
      props.post({
        type: 'uitheme-preview:height',
        height: Math.ceil(root.value.getBoundingClientRect().height),
      });
  });

  if (root.value) observer.observe(root.value);
  props.post({ type: 'uitheme-preview:ready' });
});

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  observer?.disconnect();
  waiting?.disconnect();
});
</script>

<template>
  <div
    ref="root"
    class="flex min-h-30 flex-col gap-4"
    style="padding: var(--preview-padding, 1rem)"
  >
    <div class="flex flex-1 items-center justify-center">
      <div
        v-if="control"
        role="region"
        :aria-label="`${example?.title ?? 'Default preview'} (${label})`"
        class="mx-auto flex w-full max-w-lg items-center justify-center"
      >
        <div :class="`w-full max-w-sm ${reserved}`">
          <div v-if="centered" class="flex justify-center">
            <component :is="control" v-bind="controlProps" />
          </div>
          <component :is="control" v-else v-bind="controlProps" />
        </div>
      </div>
    </div>
    <div
      aria-hidden="true"
      data-testid="theme-swatches"
      class="flex shrink-0 items-center justify-center gap-1.5"
    >
      <span
        v-for="swatch in swatches"
        :key="swatch"
        :data-swatch="swatch.slice(3)"
        :class="`size-3.5 rounded-full border border-border ${swatch}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { useUITheme, type TransitionOptions } from 'uitheme-vue';
import ThemeStudio from './components/ThemeStudio.vue';
import ThemePalette from './components/ThemePalette.vue';
import ThemePreview from './components/ThemePreview.vue';

defineProps<{ framework: string; rendering: string }>();

const transitionSettings = shallowRef<TransitionOptions>({});

const { theme, colorTheme, mounted } = useUITheme();
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header
      class="mx-auto flex max-w-6xl items-center justify-between border-b px-6 py-5"
    >
      <a href="#" class="text-sm font-semibold tracking-tight no-underline"
        >UI THEME
        <span class="ml-2 text-muted-foreground">/ {{ framework }}</span></a
      >
      <a
        href="https://github.com/tonyedgal/ui-theme"
        class="text-sm text-muted-foreground"
        >GitHub ↗</a
      >
    </header>
    <main
      class="mx-auto grid max-w-6xl gap-14 px-6 py-14 sm:py-20"
      :data-ready="mounted"
    >
      <section
        class="grid gap-6 border-b pb-12 md:grid-cols-[1fr_auto] md:items-end"
      >
        <div class="grid max-w-2xl gap-5">
          <p
            class="text-xs font-semibold tracking-[.2em] text-muted-foreground uppercase"
          >
            {{ rendering }} · Tailwind CSS v4
          </p>
          <h1
            class="text-5xl leading-none font-semibold tracking-tighter sm:text-7xl"
          >
            A change of theme.<br /><span class="text-muted-foreground"
              >A different feeling.</span
            >
          </h1>
          <p class="max-w-xl text-base leading-relaxed text-muted-foreground">
            The same UI Theme palettes and transitions. Built for
            {{ framework }} with shared state, system appearance, and your own
            CSS variables.
          </p>
          <code class="w-fit rounded-md border bg-muted px-4 py-3 text-sm"
            >pnpm add uitheme-vue</code
          >
        </div>
        <p class="text-xs text-muted-foreground" role="status">
          {{ theme }} / {{ colorTheme }}
        </p>
      </section>
      <ThemeStudio @update:settings="transitionSettings = $event" />
      <ThemePalette :settings="transitionSettings" />
      <ThemePreview />
    </main>
    <footer
      class="mx-auto max-w-6xl border-t px-6 py-6 text-sm text-muted-foreground"
    >
      UI Theme · Vue Composition API · {{ rendering }}
    </footer>
  </div>
</template>

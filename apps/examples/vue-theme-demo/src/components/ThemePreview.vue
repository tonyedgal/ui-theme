<script setup lang="ts">
import { shallowRef } from 'vue';

const notifications = shallowRef(true);

const saved = shallowRef(false);
</script>

<template>
  <section aria-labelledby="preview-heading" class="grid gap-6">
    <div class="grid gap-2">
      <p
        class="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        03 / Live preview
      </p>
      <h2 id="preview-heading" class="text-3xl font-semibold tracking-tight">
        See the whole picture.
      </h2>
    </div>
    <div class="grid gap-6 md:grid-cols-2">
      <article
        class="grid gap-5 rounded-xl border bg-card p-6 text-card-foreground"
      >
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-xl font-semibold">Make yourself at home</h3>
          <span
            class="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >Personal</span
          >
        </div>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Backgrounds, borders, controls, and type all follow the active
          palette. Your preferences stay with you.
        </p>
        <label class="grid gap-2 text-sm"
          >Workspace name<input
            class="rounded-md border bg-background px-3 py-2"
            placeholder="My workspace"
        /></label>
        <label class="flex items-center gap-3 text-sm"
          ><input
            v-model="notifications"
            type="checkbox"
            class="accent-primary"
          />Email notifications</label
        >
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="bg-primary! text-primary-foreground!"
            @click="saved = true"
          >
            Save preferences</button
          ><button
            type="button"
            class="bg-secondary! text-secondary-foreground!"
            @click="saved = false"
          >
            Reset
          </button>
        </div>
        <p v-if="saved" role="status" class="text-sm">
          Preferences saved for this preview.
        </p>
      </article>
      <article class="grid content-start gap-6 rounded-xl border bg-muted p-6">
        <h3 class="text-xl font-semibold">Built from variables.</h3>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Use the same semantic tokens with Tailwind CSS v4 or plain CSS. Change
          the palette once. The entire interface responds.
        </p>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="token in ['primary', 'secondary', 'accent']"
            :key="token"
            class="grid gap-2"
          >
            <div
              class="h-20 rounded-lg border"
              :style="{ backgroundColor: `var(--${token})` }"
            />
            <code class="text-xs">--{{ token }}</code>
          </div>
        </div>
        <pre
          class="overflow-auto rounded-lg border bg-background p-4 text-xs leading-loose"
        ><code>&lt;button class="bg-primary text-primary-foreground"&gt;
  Made for your theme
&lt;/button&gt;</code></pre>
      </article>
    </div>
  </section>
</template>

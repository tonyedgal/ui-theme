---
'uitheme-web': major
'uitheme-cli': major
---

Unify the browser runtime and framework adapters in uitheme-web. Add framework-neutral root and core entries, React and Next client entries, server-safe bootstrap helpers, Vue composables and providers, and a Nuxt 4 module. Share theme state, storage, transitions, and option validation without mandatory framework or UI primitive dependencies.

Move styled controls out of the runtime. Install editable Tailwind 3.4 or 4 controls through uitheme-cli and the versioned registry. React controls support Base UI or Radix; Vue controls use Reka. The CLI detects supported applications, previews changes, preserves edited files, installs scoped dependencies, and supports reviewed migration from earlier package imports.

This is a breaking web release. Replace packaged UIThemeSwitcher, UIThemeSelector, and select primitive imports with local controls. Move uitheme-vue imports to uitheme-web/vue, its bootstrap entry to uitheme-web/vue/bootstrap, and its Nuxt module to uitheme-web/nuxt. The previously published uitheme-vue package remains available. React Native has no release in this changeset.

---
'uitheme-web': major
'uitheme-cli': major
---

Unify the browser runtime and framework adapters in uitheme-web. Add framework-neutral root and core entries, React and Next client entries, server-safe bootstrap helpers, Vue composables and providers, and a Nuxt 4 module. Share theme state, storage, transitions, and option validation without mandatory framework or UI primitive dependencies.

Move styled controls out of the runtime. Install editable Tailwind 3.4 or 4 controls through uitheme-cli and the versioned registry. React controls support Base UI or Radix; Vue controls use Reka. The CLI detects supported applications, previews changes, preserves edited files, installs scoped dependencies, and supports reviewed migration from earlier package imports.

This is a breaking web release. Replace packaged UIThemeSwitcher, UIThemeSelector, and select primitive imports with local controls. Move uitheme-vue imports to uitheme-web/vue, its bootstrap entry to uitheme-web/vue/bootstrap, and its Nuxt module to uitheme-web/nuxt. The previously published uitheme-vue package remains available. React Native has no release in this changeset.

Expand the copied controls with Theme Selector, Icon Theme Toggle, and Theme Switcher. Set transition type, duration, and slide direction on each control. Install Theme Disclosure and Color Theme Disclosure separately for inline choices. Support upward and downward disclosure expansion. Remove copied transition and icon helpers. Preserve provider transition defaults for omitted control settings. Keep optional shadow borders on floating controls. Install the runtime through uitheme-web@latest.

Publish component documentation from MDX with matched source previews, complete registry dependencies, framework-specific examples, theme-aware syntax highlighting, and Markdown exports for agents.

Reuse one shared `cn` utility at the configured utils alias. Create or repair it when missing, preserve valid existing utilities, and validate exports before replacement. Remove per-component class and border helpers. Keep border styling and Theme Toggle icons in their components.

Show dependency names without versions in source disclosures. Remove internal registry revision text from consumer documentation and copied pages. Add framework Guides with example repository links and a consumer-first writing guide.

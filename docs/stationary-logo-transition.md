# Stationary centered SVG logo

The SVG logo is now a visible image node at the viewport center. It stays at its
configured size while the page's theme reveal expands underneath it. It fades
out over the last 15% of the native transition duration.

```tsx
<UIThemeProvider
  animationType={ThemeAnimationType.SVG_LOGO}
  logo="/brand.svg"
  logoWidth={120}
  duration={600}
>
  <App />
</UIThemeProvider>
```

`logoWidth` and `logoHeight` accept positive numbers in CSS pixels or `"auto"`. Set either
one to preserve the SVG aspect ratio; set both to fit the artwork inside that
box using `object-fit: contain`. Default width is 96 px. Invalid dimensions use
the default/aspect-ratio calculation. The same options work on every provider,
`useTheme`, and the standalone controls.

For this effect, the logo and reveal always use the viewport center. Button refs,
per-call origins, and `animationPosition` do not relocate them. The actual SVG
artwork colors are retained. Preloading, unavailable-asset circle fallback, and
immediate reduced-motion updates continue to work.

## Implementation and research

[Chrome's official View Transition documentation](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
explains that a named element is captured in a separate group, independent of the
root snapshot. [MDN's view-transition-name reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)
documents the unique-name requirement. The logo receives a unique name, so its
snapshot sits above the page reveal without scaling or inheriting that clip.
It is mounted before capture, removed on native completion or interruption, and
excluded entirely when reduced motion or an unavailable API bypasses capture.
Core consumers should use `runThemeTransition` for this lifecycle; the low-level
SVG animation helper only constructs the centered page reveal.

**Before:** the SVG silhouette itself grew to cover the page.

**After:** a fixed logo is displayed in the middle, with an independent circular
reveal expanding underneath and an opacity-only finish on the logo layer.

**Why:** the brand mark stays legible and at the requested dimensions throughout
the theme change. It no longer needs oversized SVG masks or a second mask layer
to fill logo cutouts.

## Verification

Focused browser verification passed 56 cases across Chromium DPR 1/2/3, WebKit
DPR 2, and Firefox DPR 2, with four Firefox active-snapshot comparisons skipped
because of Mozilla's documented screenshot limitation. Checks include declared
width/height combinations, unchanged DOM and snapshot dimensions/position at
different progress points, center origin despite a corner setting, SVG upload,
all provider forwarding, final-corner coverage, interruption cleanup, unavailable
assets, and reduced motion. Chromium's rendered midpoint was visually inspected. A further 20 focused checks
passed after the gallery update, covering dimensions, SVG uploads, reduced motion,
failed captures, and rapid replacement. Another 20 checks verified explicit
140-by-90 sizing through all four providers across the five browser configurations.

Package type checking, production build, and core lint passed. The existing
repository-wide React lint policy violations remain outside this change.

[Try the sized-logo gallery](http://127.0.0.1:4179/?gallery&animation=svg-logo&logo=/logo.svg&logoWidth=120&duration=1200).
The gallery includes width and height controls alongside its file picker.
The [updated recording](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/stationary-logo/svg-logo.webm)
and midpoint screenshot are saved in the local stationary-logo artifact directory.

Full Chromium profiling separately exercised 3215 × 2000 CSS pixels at DPR 1.8
and 2, with 1500 ms linear playback. The reported renderer was ANGLE Metal on
Apple M3 Max. Across an initial run and an independent repeat, cumulative raster
work was 4.6–7.3 ms across workers. Final-quarter callback p95 was 9.8–10.4 ms.
The initial fractional-scale condition had one 191.6 ms callback gap; the repeat
did not reproduce it (maximum 10.3 ms in all three repeated conditions). The
outlier remains in the saved traces. These are timeline diagnostics, not physical
frame-presentation or FPS measurements.

The previous expanding-silhouette GPU measurements in the earlier report describe
the earlier implementation, not this stationary-logo effect. No compositor-only
or physical Arc/4K performance guarantee is inferred from these browser checks.

Use `logoLight` and `logoDark` together instead of `logo` to select the destination theme’s asset: light for dark-to-light, dark for light-to-dark. Both are required; combining the pair with `logo` is rejected.

When one dimension is set and the other omitted, the omitted dimension defaults to `"auto"` and preserves the SVG aspect ratio. Explicit `"auto"` for both uses the SVG’s intrinsic size. With both omitted, the existing 96 px default width is preserved.

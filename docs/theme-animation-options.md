# Shape and logo theme transitions

The SVG effect was subsequently changed to a fixed, visible center logo. See
[stationary SVG logo configuration and verification](stationary-logo-transition.md)
for its current behavior. The expanding-silhouette implementation and GPU results
below are historical evidence of the earlier version.

The library supports these new effects for both light/dark and color-palette changes:

| Effect             | Behavior                                      | Options                                                             |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------- |
| `CLIP_PATH`        | Sharp straight or diagonal polygon wipe       | `clipPathDirection`                                                 |
| `POLYGON_GRADIENT` | Polygon wipe with a translucent leading edge  | `clipPathDirection`, `gradientWidth`                                |
| `TRIANGLE`         | Upright triangle expanding from its origin    | `animationPosition`, clicked element/ref, explicit `origin`         |
| `SVG_LOGO`         | SVG silhouette expanding, then a solid finish | `logo`, `animationPosition`, clicked element/ref, explicit `origin` |

`CIRCLE`, `BLUR_CIRCLE`, and `SLIDE` remain available. Circles also support fixed
`animationPosition` values, including the top-left blurred circle in the reference.
No GIF option was added.

## Research before implementation

The requested references were [RDSX's theme-toggle gallery](https://theme-toggle.rdsx.dev/)
and [Chanh Dai's theme-toggle effects](https://chanhdai.com/components/theme-toggle-effect).
Their implementations were inspected, including the published
[triangle registry asset](https://chanhdai.com/r/theme-toggle-effect-triangle.json).
The new geometry and lifecycle implementation were written for this library.

Official sources informed the implementation:

- [Chrome: same-document View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document): capture and `ready` must precede snapshot animation.
- [MDN: polygon](https://developer.mozilla.org/en-US/docs/Web/CSS/basic-shape/polygon): compatible vertex counts allow a sharp wipe without scaling page content.
- [MDN: mask-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-mode): SVG image masks use explicit alpha mode, independent of artwork color.
- [MDN: mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite): additive mask layers combine the logo silhouette and solid finishing reveal.
- [MDN: SVG as an image](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_image): image-context SVG has different capabilities from inline SVG; supplied assets are decoded as images, not injected as markup.
- [web.dev: animation performance](https://web.dev/articles/animations-guide): native animation does not guarantee compositor-only rendering. Clip and mask performance must be measured on the target renderer.

## Public API

Import `ThemeAnimationType`, `TRANSITION_DIRECTIONS`, and `preloadThemeLogo` from
`uitheme-web/react` or `uitheme-web/core`. `TransitionDirection`,
`AnimationPosition`, and `ThemeAnimationOptions` are exported types.

`clipPathDirection` defaults to `top-left`. Its values, in clockwise order, are:
`top-left`, `top`, `top-right`, `right`, `bottom-right`, `bottom`, `bottom-left`, `left`.
`animationPosition` additionally accepts `center` and `trigger`.
All coordinates remain viewport-relative CSS pixels, including on high-DPI displays.
Fixed positioning overrides the trigger; a per-call `origin` overrides fixed positioning.
Triangle/logo default to the trigger when available, otherwise the center.
The sharp and feathered wipes use their selected direction independently of the trigger.
Slide continues to use its existing `slideDirection` option.

```tsx
const { toggleTheme } = useTheme({
  animationType: ThemeAnimationType.SVG_LOGO,
  logo: '/brand.svg',
  animationPosition: 'center',
  duration: 600,
});

<button onClick={(event) => void toggleTheme({ element: event.currentTarget })}>
  Change theme
</button>;
```

The four providers and both standalone controls accept the same options.
`gradientWidth` defaults to 80 CSS pixels and is capped at 20% of its gradient
length. Existing boolean bypass arguments and ref-based calls remain supported.

### Logo assets

Use a public SVG file URL, imported asset URL, `data:` URL, or a `blob:` URL from
`URL.createObjectURL(file)`. Keep artwork self-contained, with a transparent
background and a suitable `viewBox`. The decoded image's aspect ratio is retained.
Logo colors do not change the alpha silhouette.

The hook preloads on configuration changes, outside the view-transition capture.
Core callers can explicitly `await preloadThemeLogo(url)`. Fetch/decode errors and
pending assets use the circle effect for that toggle. Non-SVG responses, including
GIF data, are rejected. Fetches are bounded by a two-second timeout and do not hold
up a click. Blob URL ownership stays with the caller.

A logo can contain holes, multiple separated shapes, and transparent margins.
Simply enlarging it cannot guarantee full viewport coverage. The implementation
therefore shows its silhouette first, then adds a solid circular reveal over the
final portion of the animation. All four corners are covered before the snapshot
is removed; the theme does not suddenly fill the cutouts at cleanup.

## Reviewable browser fixture

Run `pnpm --filter uitheme-web test:browser:serve` and open
[the gallery](http://127.0.0.1:4179/?gallery&duration=1200&animation=triangle&position=center).
It offers effect, direction, origin, and actual SVG file controls. The existing
freeze/resume controls allow inspection at a chosen progress; `progress=0.55`
shows the logo silhouette before its solid finish. `easing=linear` separates
geometry from the default easing. `corner=top-right` places the clicked toggle
at the screen edge for large-display checks.

## Browser findings

WebKit pixel tests initially failed with the generated gradient SVG's 1-by-1
coordinate space. A 100-by-100 viewBox with matching geometry and gradient
coordinates rendered correctly at the origin and final corners. Tests inspect
all eight directions rather than assuming mirrored geometry works.

Firefox accepted WAAPI pseudo targeting for sharp clips but returned no applied
clip style. The library detects that absence and uses a native CSS keyframe
animation of the same pseudo-element and duration. Fallback styles are removed
on finish or cancellation. Other engines retain the direct WAAPI path.

Firefox's screenshot path omits in-progress view transitions, as described in
[Mozilla bug 2008417](https://bugzilla.mozilla.org/show_bug.cgi?id=2008417).
An opacity-zero probe confirmed the local screenshot still captured the live
new page. Consequently Firefox's active-transition pixel tests are explicitly
skipped; computed pseudo styles, API forwarding, reduced motion, cancellation,
and committed theme state are tested there. Chromium and WebKit perform the
actual mid-transition direction, silhouette-hole, and final-corner pixel checks.
Screenshot color comparisons allow one RGB level of rounding for WebKit snapshot
color conversion, while requiring a large color change where reveal is expected.

## Motion review

**Before:** three animation modes, with trigger-based origins and no asset-driven reveal.

**After:** eight-direction sharp and feathered wipes, expanding triangle, SVG
silhouette with a complete finish, and fixed edge/corner/center origins. Native
timelines drive the effects; layout and text remain stationary during reveals.

**Why:** users can choose a directional or branded transition without mutating
refs, multiplying coordinates by display scale, or introducing a GIF dependency.

- Critical: reduced motion bypasses capture; cancellation removes native animations
  and temporary CSS; failed assets do not block a theme update.
- High: rendered pixels verify selected directions and viewport coverage, including
  logo holes. Firefox screenshot limitations remain explicitly bounded.
- Polish: shared duration/easing, preserved aspect ratio, bounded feathering, and
  a solid logo finish keep the effects consistent with existing motion.

## Verification results

The expanded full browser run passed **163 cases with 12 intentional skips**:

| Project                              | DPR | Passed | Skipped |
| ------------------------------------ | --- | ------ | ------- |
| Chromium, 1280 × 800                 | 1   | 34     | 1       |
| Chromium, 1440 × 900                 | 2   | 35     | 0       |
| Chromium mobile emulation, 390 × 844 | 3   | 34     | 1       |
| WebKit, 1280 × 800                   | 2   | 34     | 1       |
| Firefox, 1280 × 800                  | 2   | 26     | 9       |

Four skips avoid repeating the large-viewport duration test. Eight Firefox skips
exclude active-transition screenshot comparisons because of the documented
capture limitation. A focused rerun after refining the diagonal gradient's
CSS-distance calculation passed another eight checks, with two Firefox skips.
All eight wipe directions, fixed origins, actual SVG file upload, hollow logo
coverage, provider forwarding, interruption, and reduced motion are covered.

Package type checking and production build passed. The core animation, transition,
logo, type, and export files pass the repository's ESLint configuration. The
broader React source lint check still reports policy violations such as existing
conditional context hooks, effect state updates, and assertions; this is not a
repository-wide lint cleanup. Vitest has no separate unit-test files; browser
tests provide the runtime coverage.

Four [recordings and midpoint screenshots](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/new-effects)
were saved and their rendered geometry inspected. The recordings show mode and
palette changes at 1200 ms, including frozen inspection followed by resumed
playback. They are visual evidence, not an FPS measurement.

### GPU profiling

The profiler ran separately from tests and recording, using full Chromium
151.0.7922.34 with **ANGLE Metal / Apple M3 Max** reported by
`SystemInfo.getInfo`. Each effect ran at 3215 × 2000 CSS pixels, DPR 1.8 and 2,
from top-right and top-left. Duration was 1500 ms with linear easing to expose
the tail. Clip/gradient selected the corresponding direction; triangle/logo
used the clicked corner button.

| Effect                 | Cumulative raster work across workers | Final-quarter callback p95 |
| ---------------------- | ------------------------------------- | -------------------------- |
| Sharp polygon wipe     | 14.7–15.2 ms                          | 8.4–8.8 ms                 |
| Feathered polygon wipe | 10.6–12.1 ms                          | 9.4–9.6 ms                 |
| Triangle               | 13.3–14.3 ms                          | 9.1–9.8 ms                 |
| SVG logo, initial runs | 9.7–12.5 ms                           | 9.0–10.0 ms                |

One initial fractional-scale SVG run had a 150.2 ms final-quarter callback gap
and an earlier 233.4 ms gap. Its trace contained long GPU and layer-teardown
tasks; those observations do not conclusively identify the cause. Two complete
independent repeats of the same three SVG conditions did not reproduce it:
final-quarter p95 was 8.9–9.7 ms and maximum intervals were 9.6–10.3 ms. The
outlier is retained in the evidence instead of being discarded.

The [GPU summary](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/new-effects/performance-summary.json)
and individual timing probes are saved with the visual artifacts. Raw traces
remain under `/tmp/ui-theme-evidence/new-*`; open them in Chrome's Performance
panel. Cumulative raster time is neither elapsed animation time nor FPS.
Callback timing measures the browser timeline, not physical frame presentation.
These samples do not establish compositor-only acceleration, guarantee arbitrary
SVG performance, or substitute for manual Arc/4K inspection of every new effect.

Motion review: **Approve**, with the Firefox screenshot boundary and unreproduced
SVG timing outlier explicitly retained above.

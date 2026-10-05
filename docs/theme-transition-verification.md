# Theme transition research and verification

Verified locally on 2026-10-01. This change animates palette switches through the same path as mode switches, removes temporary ref mutation, reduces blurred-circle rendering work, respects explicit durations on large displays, and covers the far corner before snapshot cleanup.

The later [shape/logo verification](theme-animation-options.md) expands this suite
and corrects its Firefox visual boundary: Firefox's screenshot API omits active
view transitions (Mozilla bug 2008417). The original Firefox final-corner result
therefore did not establish snapshot coverage. That pixel check is now explicitly
skipped in Firefox; Chromium and WebKit retain it. The later implementation also
adds a native CSS fallback when WAAPI does not apply a pseudo-element clip style.

## Official documentation consulted before implementation

- [Chrome: same-document View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document): update callbacks, snapshots, `ready`, circular clips, interruption, and reduced motion.
- [CSS View Transitions specification](https://drafts.csswg.org/css-view-transitions-1/): the snapshot containing block and transition pseudo-elements. Viewport CSS coordinates are the appropriate origin for these root snapshots; mobile viewport changes deserve separate testing.
- [MDN: getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) and [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio): DOM rectangles are viewport-relative CSS pixels; DPR describes physical pixel density. Multiplying the rectangle by DPR is incorrect for CSS circle coordinates.
- [MDN: ViewTransition.ready](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/ready) and [skipTransition](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/skipTransition): skipped or failed captures can reject `ready`; skipping still runs the update callback.
- [web.dev: high-performance CSS animations](https://web.dev/articles/animations-guide) and [Chrome: hardware-accelerated animations](https://developer.chrome.com/blog/hardware-accelerated-animations): prefer transform/opacity when the effect permits it, inspect painting and rasterization, and avoid assuming layer promotion guarantees acceleration. The Chrome article describes particular implementations from 2021; it is not proof of current compositor support for every circle or mask.
- [MDN: innerWidth](https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth): the layout viewport measurement is an integer. Captured snapshot dimensions can retain fractional CSS pixels at browser zoom, as observed in Arc.
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) and [Animation.finished](https://developer.mozilla.org/en-US/docs/Web/API/Animation/finished): frame callbacks provide diagnostic timestamps; animation completion is tracked through the native lifecycle. Callback intervals do not measure actual GPU presentation frames.

The `debug-animation`, `css-animations`, and `review-animations` skills informed diagnosis, implementation choices, and the final motion review. Performance guidance was also consulted. The optional `improve-animations` skill is advisory; this implementation follows the user's explicitly authorized fixes.

## Diagnosis and implementation

### Palette changes

Previously `switchColorTheme`, cycling, and target helpers updated state directly. They now use the shared native transition runner used by light/dark mode. `setTheme` and `setColorTheme` remain immediate. All four providers forward the options. TanStack's persistence callbacks now run from the shared commit path, including palette cycles and target helpers, once per update.

The selector keeps its own trigger ref. The mode switcher reads the clicked option rather than its currently active option. Keyboard interactions in the built-in controls and directly bound color helpers skip the decorative reveal; reduced motion always skips it.

### Circle origins

The original core circle already used CSS pixels. The supplied portfolio workaround introduced DPR scaling outside the library. Provider convenience methods also temporarily replaced `ref.current`, and a standalone switcher could measure the active option instead of the clicked option.

Animated methods accept `element`, `origin`, and `animationOff`. The library reads the element rectangle synchronously before capture. Explicit origin takes precedence over element, which takes precedence over the existing hook ref. Ref values are never overwritten. Coordinates remain viewport-relative CSS pixels at every DPR and zoom level.

```tsx
<button
  onClick={(event) => {
    void toggleTheme({
      element: event.currentTarget,
      animationOff: event.detail === 0,
    });
  }}
>
  Toggle theme
</button>
```

Remove consumer code that multiplies rectangles by DPR or swaps fake objects into refs. Legacy boolean arguments and attached button refs remain supported. This work does not modify the portfolio application or publish a package release.

### Rendering and responsiveness

The old “high resolution” heuristic inspected CSS viewport dimensions, missed many high-DPI displays, and forced durations to at least 500 ms. It is removed. A requested 100 ms remains 100 ms, including a 3200 × 2000 CSS-pixel viewport. The default changes from 750 ms with `ease-in-out` to 400 ms with `cubic-bezier(0.32, 0.72, 0, 1)`. The full-viewport travel and steep early progress justify a duration above the usual small-control budget.

The blurred circle previously animated oversized Gaussian-filtered SVG masks on both snapshots. It now feathers a bounded radial gradient on the new snapshot only. `blurAmount` means feather width in CSS pixels, capped at 20 px; zero selects a sharp circle. Text and cards remain at their original scale.

The ordinary circle remains a native circular clip. It still generated Paint events in Chromium, so it is not described as compositor-only. Removed promotion hacks, trial `will-change`, paint containment, overflow clipping, and an equivalent `inset(... round radius)` did not provide a measured improvement and were not adopted. The concrete improvements include correct explicit timing, reduced blur work, native lifecycle cleanup, and suppression of competing page CSS transitions during library-owned capture/playback.

The circle now measures the captured new snapshot once after `ready`, uses the larger of its CSS dimensions and the viewport dimensions, and adds one CSS pixel of overscan. Arc at 90% zoom reported `innerWidth = 3215` but a snapshot width of `3215.55px`. A controlled browser reproduction with the viewport measurement one pixel smaller than the captured box exposed an old-theme pixel at the final corner before cleanup. The same rendered corner matches the live page after the fix in all five browser projects. This guards against a small cleanup edge jump; it does not establish fractional rounding as the sole cause of the previously reported large-screen jank.

The requested six-second corner inspection distinguished easing from stalls. On the user's maximized 4K Arc window, the user reported that the ending slowed smoothly and no longer jumped. The default curve intentionally decelerates the radius. Constant-radius-speed playback is available with `easing: 'linear'`; the test page links to a comparison. No further duration adjustment or GPU hint was added to disguise the ending.

The document-scoped runner interrupts older transitions, waits for skipped update callbacks before the next capture, and executes every requested update once. It handles capture rejection, unsupported pseudo-element targeting, reduced motion, and cleanup. Slide uses a full WAAPI transform and needs no circle origin. Core consumers can use `runThemeTransition`; low-level helpers now return native `Animation` handles and must run after `ready` with caller-managed pseudo-element styles.

## Browser verification

The checked-in Playwright suite exercises the actual source in a dedicated page. It verifies declared refs, explicit elements, fractional origins, transformed parents, scrolling, fixed/mobile placement, CSS zoom, DPR 1/2/3, palette cycles and direct helpers, all providers, callback counts, rapid requests, skipped and failed captures, unsupported targeting, reduced motion, keyboard controls, short durations, slide, bounded blurred masks, and actual far-corner pixels before and after snapshot cleanup.

| Project                   | CSS viewport | DPR | Passed | Intentional skips |
| ------------------------- | ------------ | --- | ------ | ----------------- |
| Chromium                  | 1280 × 800   | 1   | 19     | 1                 |
| Chromium                  | 1440 × 900   | 2   | 20     | 0                 |
| Chromium mobile emulation | 390 × 844    | 3   | 19     | 1                 |
| WebKit                    | 1280 × 800   | 2   | 19     | 1                 |
| Firefox                   | 1280 × 800   | 2   | 19     | 1                 |

Final full run: **96 passed, 4 intentional skips**, no failures.

Four large-viewport repetitions are intentionally skipped: that regression runs once in the Chromium DPR 2 project. These are coverage choices, not unsupported-browser failures.

Native Arc was inspected with a visible CSS-pixel marker and playback frozen at 5% progress. The circle was centered on the actual fixed button at DPR approximately 1.8 (90% browser zoom) and DPR 2. The later slow top-right test used a 3215 × 2000 CSS viewport, approximately DPR 1.8, on the user's maximized 4K screen. The captured probe had no resize or visibility changes, finished normally at about 6025 ms, and showed first-half and final-quarter 95th-percentile callback intervals of about 16.8 and 16.7 ms respectively. This was a synthetic fixture in the external Arc app, not a portfolio-page reproduction or a GPU presentation benchmark. Playwright WebKit is not the installed Safari app.

The built package was also exercised in the running Next.js and TanStack examples at DPR 2. Selecting caffeine changed the primary-button background, kept the current mode, and used the selector's measured center: Next `(1021.5625, 502.5)`, TanStack `(1010.5703125, 506.5)` CSS pixels. Clicking dark then produced `dark theme-caffeine`. Both recorded 400 ms animations and no page errors.

A DPR 2 [frozen circle screenshot](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/circle-origin-dpr2.png), [frozen feathered screenshot](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/blur-origin-dpr2.png), and [normal-speed recording](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/mode-and-palette.webm) are saved locally. The recording ends with frozen origin inspection; it is not an FPS measurement. Raw built-app observations are in `/tmp/ui-theme-app-check.jsonl`. Temporary evidence is not part of the published package.

## Performance measurements

Chromium 151.0.7922.34, synthetic page with 80 themed cards. Traces cover one transition from click through native completion. Metrics sum `RasterTask` durations across rendering workers; they are **not elapsed animation time, FPS, or a dropped-frame count**. A single sample per condition is diagnostic rather than a statistical performance guarantee.

The original short-duration comparisons below used Playwright's headless shell. A subsequent renderer inspection identified software compositing/rasterization and SwiftShader. Their results describe that software-rendered fixture, not the Mac's hardware GPU or Arc. The profiling script now defaults to full Chromium and records `SystemInfo.getInfo` renderer/feature status; `--software` explicitly selects the old shell.

The table holds duration (750 ms) and easing (`ease-in-out`) constant between the original and changed implementations. The changed measurements ran separately from the browser test suite.

| CSS viewport / DPR                           | Circle raster ms, before → after | Blurred raster ms, before → after | Blurred Layout events, before → after |
| -------------------------------------------- | -------------------------------- | --------------------------------- | ------------------------------------- |
| 1440 × 900 / 1                               | 12.6 → 20.6                      | 3064.8 → 269.0                    | 59 → 7                                |
| 1440 × 900 / 2                               | 12.7 → 11.2                      | 2911.1 → 264.6                    | 60 → 7                                |
| 1920 × 1080 / 2 (3840 × 2160 backing pixels) | 15.1 → 11.8                      | 3263.6 → 413.5                    | 44 → 7                                |

This software-rendered sample shows approximately **8–11× less cumulative raster work for the blurred circle**. It does not show a consistent sharp-circle rendering improvement; the default duration/curve and removal of the forced floor address its responsiveness.

The ordinary circle's baseline cumulative raster cost was about 13–15 ms across these sizes; its changed runs were similarly small. The main measured saving belongs to the blurred variant. Masks and circular clips can still paint, and performance varies with page content, graphics hardware, engine, and display refresh rate. Mobile pinch zoom, a viewport resized mid-animation, and arbitrary animated portfolio layouts were not exhaustively tested.

Raw baseline traces are `/tmp/ui-theme-evidence/baseline-*.json`. Default-curve changed traces are `/tmp/ui-theme-evidence/after/*.json`; the 750 ms duration was retained to inspect work over the same time span, although their easing differs from baseline. Controlled same-easing traces are `/tmp/ui-theme-evidence/controlled/*.json`. Open these in Chrome's Performance panel to inspect individual rendering events.

### Large corner tests using the hardware GPU

Full Chromium reported **ANGLE Metal Renderer: Apple M3 Max**, with GPU compositing and rasterization enabled. The six-second tests used 3215 × 2000 CSS pixels, exceeding the earlier 1920 × 1080 test and matching Arc's observed layout size more closely. At DPR 2, those dimensions correspond to 6430 × 4000 device pixels; display scaling and browser zoom mean the physical screen label alone does not determine the snapshot workload.

| Origin / DPR    | First-half callback interval p95 | Final-quarter callback interval p95 | Final-quarter maximum |
| --------------- | -------------------------------- | ----------------------------------- | --------------------- |
| Top right / 1.8 | 9.1 ms                           | 9.0 ms                              | 9.4 ms                |
| Top right / 2   | 9.1 ms                           | 9.1 ms                              | 9.3 ms                |
| Top left / 2    | 9.0 ms                           | 9.0 ms                              | 9.3 ms                |

All three finished normally at about 6004–6008 ms, with no viewport/visibility interruptions. The default easing's last 10% of time advances the radius by only about 4 CSS pixels; this explains visible smooth deceleration despite steady callback timing. GPU-backed linear comparisons also completed normally. These are rendering-callback observations, not claims about every physical presentation frame or guaranteed FPS.

Software-rendered tests at the same large size had longer late callback gaps (roughly 17–33 ms p95 depending on the curve), whereas the GPU tests did not exhibit that tail pattern. Thus the software slowdown cannot be presented as a reproduction of Arc's GPU behavior. Trials of containment, clipping, promotion, and rounded insets provided no useful GPU tail improvement.

Raw GPU tail traces and full callback samples are in `/tmp/ui-theme-evidence/gpu-tail/` and `/tmp/ui-theme-evidence/gpu-tail-linear/`. Saved [GPU timing summary](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/gpu-tail.json) and [linear timing summary](/Users/tony/.codex/visualizations/2026/10/01/01a0f676-f119-78a2-86e7-6beca4fe291e/ui-theme-transitions/gpu-tail-linear.json) retain the renderer status and observations. The native Arc values above were read from the fixture's visible diagnostics. The user independently confirmed the ending no longer jumped.

Reproduce correctness:

```sh
pnpm install
pnpm --filter uitheme-web exec playwright install chromium webkit firefox
pnpm --filter uitheme-web test:browser
```

Reproduce changed rendering measurements in a separate idle run:

```sh
pnpm --filter uitheme-web test:browser:serve
# In another terminal, from packages/ui-theme:
THEME_PROFILE_EASING=ease-in-out node tests/browser/profile.mjs
# Full Chromium uses the available GPU; renderer status is saved in summary.json.
THEME_PROFILE_OUTPUT=test-results/tail node tests/browser/profile.mjs --tail
THEME_PROFILE_OUTPUT=test-results/tail-linear THEME_PROFILE_EASING=linear node tests/browser/profile.mjs --tail
# Add --headed for a visible browser, or --software for headless-shell comparison.
```

Use `/?duration=400` for normal playback, `/?duration=6000&corner=top-right&probe` for the requested slow ending inspection, `/?duration=6000&corner=top-left&probe` for the opposite diagonal, and `/?animation=blur-circle` for the feathered version. Add `&easing=linear` to compare constant-radius-speed playback. Freeze stops playback at 5% by default; add `&progress=0.99` to inspect the ending, and press **R** to resume. Native root snapshots suppress pointer hit-testing while active, so a frozen transition cannot be resumed by clicking through its snapshot.

## Package and example checks

- Package TypeScript check: passed.
- ESM/CJS and declaration build: passed.
- Existing Vitest command: passed with no unit-test files; the browser suite supplies the regression coverage.
- Formatting and whitespace checks: passed for the changed files.

The two TanStack examples have existing typecheck blockers. Their checked-in `ignoreDeprecations: "6.0"` is invalid under their installed TypeScript 5.9. With a command-line 5.0 override, the client example still references a missing `/about` route in `Header.tsx`, and the SSR example has unused imports in `routes/index.tsx`. These lines were confirmed in HEAD; they were not introduced by this change. The modified ThemeStudio components produced no additional errors in those checks.

## Final motion review

| Before                                                  | After                                                           | Why                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Palette changes jump immediately                        | Palette and mode changes share one reveal path                  | Consistent feedback for the same kind of visual state change      |
| 750 ms weak default; large viewport enforces ≥500 ms    | 400 ms steep curve; explicit duration preserved                 | Full-screen travel stays readable while responding earlier        |
| Gaussian SVG masks on old and new snapshots             | One bounded feathered gradient on the new snapshot              | Reduces filtered surface work without scaling content             |
| Active-option ref or temporary ref replacement          | Clicked element or explicit CSS origin, measured before capture | Correct spatial origin without relying on ref mutation            |
| Radius ends at an integer viewport corner               | Radius covers fractional captured bounds with 1 CSS px overscan | Far corner matches the live page before cleanup, including zoom   |
| Unhandled capture cancellation and overlapping requests | Document-scoped interruption and cleanup                        | Latest visual request wins and requested updates run once         |
| Standalone selection uses an immediate setter           | Selection reveals from its trigger; keyboard skips reveal       | Pointer origin is meaningful; keyboard navigation stays immediate |
| Hover overlay has `transition: all`                     | Unnecessary transition removed                                  | Avoids unspecified animated properties                            |

**Performance:** circle clipping and gradient masking remain paint-capable (`packages/ui-theme/src/core/animations.ts`). A transform-only substitution would scale the snapshot's content or require a more complex compensating structure; there is no demonstrated simple equivalent preserving this requested reveal. The blurred path is substantially cheaper in the software-rendered fixture. Large GPU corner tests showed steady late callback timing, and the user confirmed Arc's ending no longer jumped. Slide uses transform; users can choose it or disable reveals on costly pages.

**Interruptibility and timing:** older playback is skipped, native animations are canceled, and state callbacks are sequenced (`packages/ui-theme/src/core/transitions.ts:21`). This restarts the new reveal rather than smoothly retargeting the previous circle radius. Rapid-request tests exercise API calls and confirm the final requested state and cleanup. Native root capture suppresses pointer hit-testing while playback is active ([specification](https://drafts.csswg.org/css-view-transitions-1/#view-transition-painting-order)); these tests do not claim repeated pointer clicks can retarget the reveal during that interval.

**Origin and cohesion:** mode/palette controls share configuration and origin precedence (`packages/ui-theme/src/react/hooks/use-theme.ts:215`). Native Arc markers and browser assertions agree with CSS element centers.

**Accessibility:** reduced-motion updates are immediate. Built-in keyboard controls and directly bound color helpers skip decorative movement. Custom controls should pass `animationOff: event.detail === 0` as shown above. This was a motion review, not an exhaustive audit of every pre-existing control style or hit area.

**Approve** for the verified behavior and measured rendering improvements, with the explicit performance and environment limits above. No release, commit, or push has been made.

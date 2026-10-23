# Vue and React Native release review

Review date: October 23, 2026 (Africa/Lagos).

The code and package checks pass. RN and Vue remain draft PRs #20 and #21.
Neither package is ready for stable publication. The dependency audit and native
performance checks fail. The final iPhone follow-up below records completed
controls and accessibility checks, plus the remaining device gates. Nothing was
published.

## Independent review and fixes

One independent agent reviewed both implementations and the final hardening.
The reviewer found no further package correctness blocker after these fixes:

| Finding                                                        | Resolution                                                                                                  | Evidence                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Vue toggling selected an appearance excluded by the provider   | Toggle only among configured appearances; a singleton is a no-op                                            | Subset and singleton browser cases reproduced the bug before the fix and now pass |
| Vue controls exposed unavailable appearances                   | Intersect control choices with provider choices; show a placeholder for an excluded current value           | Browser checks across three browser configurations                                |
| Vue declarations failed in a strict NodeNext consumer          | Resolve emitted relative declaration imports to explicit JavaScript paths, including component declarations | Independent tarball installation with `skipLibCheck: false`                       |
| Normal RN installation selected incompatible animation peers   | Restrict Reanimated to 4.5.x, Worklets to 0.10.x, Skia to 2.11.x, and NativeWind to RC0                     | Ordinary npm installation, without force or legacy peer flags                     |
| RN transition documentation referenced an unconfigured palette | Define and pass the palette in a complete example                                                           | Source and export review                                                          |
| Earlier smoke checks reused workspace dependencies             | Add real isolated consumers outside the repository                                                          | Fresh npm installs from both packed packages                                      |

The isolated runner clears old evidence before each run. Its Nuxt check uses the
server process it starts, on an assigned port. CI runs the runner when relevant
source or runner files change and uploads its evidence.

## Current local evidence

- All 12 workspace builds and all 12 workspace type checks pass.
- Repository lint passes with zero warnings.
- Nine RN preference-store tests pass.
- Both package smoke checks pass. RN checks ESM and CommonJS core execution and
  verifies that optional engines do not enter the root/core bundles.
- All 36 Vue browser checks pass against fresh production builds and a focused
  subset fixture: Chromium at DPR 2, WebKit, and mobile Chromium.
- Browser coverage includes appearance/palette persistence, system appearance,
  all seven web effects in both directions, interruption, keyboard activation,
  reduced motion, unavailable transitions, blocked storage, cross-tab updates,
  invalid cookies, and isolation between Nuxt requests.
- The isolated Vue tarball consumer passes strict NodeNext declaration checks
  and real server rendering. The isolated Nuxt 4.6.2 app passes preparation,
  type checks, production build, browser hydration, and preference reload.
- The isolated RN tarball consumer passes ordinary npm installation and strict
  root/core declarations without DOM libraries. The root and all five optional
  entries resolve and bundle in a fresh Expo app for iOS and Android. Core passes
  separate ESM/CommonJS execution and declaration checks. Optional-entry declaration
  checks use `skipLibCheck: true`; these checks do not prove strict correctness
  of all upstream peer declarations or device rendering.
- The tested native pairing is Expo SDK 57, React Native 0.86.3, React 19.2.3,
  Reanimated 4.5.1, Worklets 0.10.1, Skia 2.11.1, NativeWind 5 RC0, and Uniwind
  1.12.2. Wider declared RN/Expo ranges have not received equivalent device checks.

The complete consumer result is in
`test-results/release-consumers-vue/summary.json`. Logs and the independent Nuxt
screenshot are beside that file. Vue reports and screenshots are under
`packages/ui-theme-vue/playwright-report` and `packages/ui-theme-vue/test-results`.
These generated folders are ignored by Git and configured for CI artifact upload.

### iPhone release builds

Fresh signed Release archives build with Xcode 27.1 for the TypeScript, NativeWind,
and Uniwind examples. All three apps install and launch on the
connected iPhone 15 Pro running iOS 27.0.1. Physical screenshots confirm the
TypeScript Appearance screen and both styling apps' palette, effect, and duration
controls. Utility and native color samples match in both styling screenshots.
The screenshots are saved under `test-results/iphone-release-2026-10-23/`.

The free signing profile permits three installed development apps. The unrelated
Car Platform app was preserved. The theme examples were tested in sequence. NativeWind and Uniwind remain
installed and launch successfully.
The newly installed TypeScript test app was removed to restore the Uniwind app.
The TypeScript archive remains available for another test session.

Archives and build logs are in `/tmp/uitheme-release-native/`. Installation and
launch alone do not establish transition performance or spoken accessibility.

## Remaining release gates

1. Resolve the two high production dependency advisories. Current audit results
   are zero critical, two high, zero moderate, and zero low. The remaining paths
   are native example tooling: node-forge through Expo signing tooling, and
   braces through Metro/micromatch. The audit lists no patched release for either
   advisory. No advisory is suppressed. Re-run the audit before release.
2. Resolve Android capture stalls. Complete NativeWind palette performance,
   separate iOS capture timing, and longer memory checks. Current iPhone
   appearance metrics record zero hitches; Android metrics fail the gate.
3. Fix the TypeScript native selector's clipped Appearance label. Restore working
   iPhone follow-up automation, then finish TypeScript spoken VoiceOver and full
   iOS large-text/interruption checks. Both styling apps already pass Apple's
   accessibility audit and actual VoiceOver checks.
4. Complete spoken TalkBack checks. All three Android apps are installed and
   their nine-effect appearance/palette controls pass. Both styling apps also
   pass rapid-input, disabled-animation, and full large-text control traversal.
5. Check the latest hosted results after the final push. Earlier hosted build
   and test steps pass; the production audit fails.

Advisories:
[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv) and
[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Stable release procedure

The approved first stable release is `1.0.0` for both packages:
`uitheme-rn@0.1.0-alpha` and `uitheme-vue@0.1.0-alpha.0`.
Major changesets target `1.0.0`. Package manifests and alpha publication tags
remain unchanged while gates are open.

Complete these steps in order:

1. Resolve the production dependency audit without suppressing advisories.
2. Complete iPhone transition, interruption, frame-time, and memory checks.
3. Complete VoiceOver speech, traversal, selected-state, and focus checks.
4. Complete Android rendering, interruption, large-text, and TalkBack checks.
5. Verify isolated Vue, Nuxt, and RN consumers against packed packages.
6. Verify CI for the RN PR and the Vue child PR against its RN base.
7. Verify independent Changesets plans. Keep private example versions unchanged.
8. Review all pending web changesets before applying the release plan.
9. Apply Changesets versioning, refresh the lockfile, set both stable publication
   tags to `latest`, and validate the final archives and GitHub CI.
10. After publication authorization, release `uitheme-rn@1.0.0` and
    `uitheme-vue@1.0.0`. Verify npm versions, tags, provenance, and fresh consumers.

Do not run publication merely because an archive or browser check passes.

## Repeat the local checks

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm lint:check
pnpm format:check
pnpm --filter uitheme-rn test
pnpm --filter uitheme-rn test:package
pnpm --filter uitheme-vue test:package
pnpm --filter uitheme-vue exec playwright install chromium webkit
CI=1 pnpm --filter uitheme-vue test:browser
pnpm test:release:consumers
pnpm audit --prod
```

Browser checks require ports 4280–4282 to be free. These dedicated ports do not
reuse the open development demos on 4180–4181. The consumer runner uses a
separate assigned port and does not depend on the examples or workspace links.
The final audit command currently fails for the two disclosed advisories.

## Android follow-up: Skia capture fix

The connected Samsung SM-S948B runs Android 17. All three Release APKs now
build and install with Skia 2.11.1. Release sourcemaps were checked for the fixed
version and its Worklets serializer. The first upgrade exposed a mixed build:
old JavaScript still selected Skia 2.6.2 while native autolinking selected 2.11.1.
A full workspace install and forced JavaScript rebundle corrected that mismatch.
The corrected Uniwind process remains running without the previous capture or
serialization errors. Full effect, interruption, large-text, and TalkBack checks
remain open. Installation and initial activity launch are not stability checks.

Skia 2.6.2 invokes a removed Android drawing method. Its capture can lose overflow
clipping while still returning an image. The fix is included in
[Skia 2.11.1](https://github.com/wcandillon/react-native-skia/pull/4004).
The examples deliberately override Expo SDK 57's bundled Skia version and require
custom native builds. No Expo Go compatibility is claimed for these transitions.

The iOS Uniwind archive with 2.11.1 passes and its sourcemap includes the serializer.
All three updated iOS archives now pass. Uniwind and NativeWind install and
launch on the iPhone. The TypeScript archive passes but has not been installed
in this follow-up because the free signing profile is at its app limit. All 12
workspace builds, type checks, lint, and isolated consumer checks pass again.
Changed release files pass formatting; the whole-repository formatting command
now fails on an unrelated `.claude/launch.json`, which was preserved. Earlier
iPhone screenshots and archive results above describe the preceding 2.6.2 build.

## Release selection and stacked CI follow-up

Both initial stable releases now target `1.0.0` through major changesets.
The manifest versions remain alpha until the release version step runs.
Private workspace versions and tags are disabled in Changesets. Four isolated
release-plan checks pass: RN only, Vue only, web only, and RN plus Vue. Each
check updates only its selected public packages and leaves private versions
unchanged. The current full plan also includes pending `uitheme-web@1.2.0`.

The version wrapper runs Changesets and refreshes the lockfile. Publication
builds packages only. Normal CI retains the example checks.

Browser change detection compares the PR base SHA with the PR head SHA rather
than the synthetic merge commit. A temporary stacked Git history reproduces
unrelated parent changes entering the old diff and verifies their exclusion
from the new diff. PRs against feature branches already trigger the workflow.
Vue child draft PR #21 is open against RN draft PR #20. Hosted build and test
steps pass for both prior heads; the dependency audit fails. The refreshed local audit
still reports two high advisories; this change does not bypass that gate.

The connected iPhone launches the installed NativeWind and Uniwind apps again.
This initial check confirmed launch only. The final iPhone follow-up below
records the later effect, performance, and VoiceOver results.

## Physical-device follow-up

The user authorized removing Car Platform Demo. It was removed from the iPhone,
and the latest TypeScript archive was installed and launched. All three theme
examples are now installed. The temporary XCTest runner failed to enable device
UI automation and timed out. It was removed, and Uniwind was restored and
launched. That initial runner failure established no interaction or accessibility result.
The final iPhone follow-up below records later successful checks.

On the Samsung SM-S948B, both Uniwind and NativeWind pass 72 combined control
checks: nine effects, light/dark appearance, and two palette commands per effect.
CSS and native color labels match after appearance changes. Screenshots show
matching color samples. Both apps settle after rapid input and commit appearance
with system animation scales disabled. At font scale 1.5, all transition, appearance, palette, and duration controls
remain reachable in both styling apps.
The TypeScript preview changes appearance in both directions and returns ready.
No matching fatal/capture/serialization errors occur in the sampled Android log.
Recordings, screenshots, memory and frame data are under
`test-results/device-release-2026-10-23/`. Recorded performance includes capture
overhead and is not a clean performance baseline. No spoken TalkBack result is
claimed.

The isolated Vue-only tree passes formatting, lint, all 12 builds and type checks,
package checks, fresh Vue/Nuxt consumer checks, and 36 browser cases against
fresh servers on 4280–4282. The production audit still reports two high findings.
An independent source review found no new Vue package blocker.

### Android performance comparison

Two additional rounds ran without screen recording. Each app exercised all nine
styles in both appearance directions, for 36 appearance commands per app.
Uniwind reports 177 janky frames out of 1,067 (16.59%), with a 129 ms 99th
percentile. NativeWind reports 209 out of 1,062 (19.68%), also at 129 ms.
These aggregate Android window statistics do not isolate capture cost from the
shader or control updates. They do not pass the native performance gate.
Uniwind PSS increases from 899,061 to 920,719 kB across the two rounds;
NativeWind increases from 829,708 to 869,150 kB. Two rounds do not establish a
leak, but the retained memory and frame stalls need a focused capture profile.
Do not describe either platform as performance-ready from these results.

An isolated copy ran the actual Changesets version wrapper and lockfile refresh.
The related major changesets generate `uitheme-rn@1.0.0` and
`uitheme-vue@1.0.0`; existing web changesets generate `uitheme-web@1.2.0`.
Both resulting stable native and Vue packages build and pass packed checks.
The working repository remains alpha. No manifest version or changelog was
manually changed, and nothing was published.

TalkBack was temporarily enabled through the installed Google TalkBack service.
The app content remains accessible in the exported hierarchy while the service
is configured. Spoken speech and focus traversal are not verified. The previous
accessibility settings, font scale, animation scales, and landscape rotation
were restored after the checks.

### Capture timing and stable consumers

A temporary Release build measured eight awaited Skia view captures during four
circular appearance transitions on Android. Capture takes 113.39–133.10 ms.
Image conversion takes 0.010–0.027 ms after the first 1.49 ms conversion.
The captured delay supports profiling the native view-capture path before
changing shaders or removing the conversion. These measurements include native
scheduling and do not isolate CPU work on a particular thread. Diagnostic code
was removed after measurement; no speculative performance fix was committed.

Both isolated stable tarballs also pass the complete fresh-consumer runners.
The Vue 1.0.0 consumer passes strict declarations, SSR, Nuxt preparation, types,
production build, hydration, and preference reload. The RN 1.0.0 consumer passes
ordinary installation, strict root declarations, optional declarations, and
Metro exports for iOS and Android. Publication remains blocked by the audit,
native performance, physical accessibility, and incomplete iOS interactions.

Git history confirms all 15 pending web changesets were added after the current
`uitheme-web@1.1.0` tag. They are not removed as already-released notes. Standard
Changesets therefore includes the proposed web 1.2.0 in the full batch. No
unrelated package version is manually changed to limit that batch.

### Final iPhone follow-up

A fresh Xcode 27.1 runner completes physical iPhone checks after macOS developer
authorization. All nine effects pass appearance and palette controls in all
three apps. NativeWind and Uniwind pass Apple's accessibility audit and actual
VoiceOver traversal, spoken selected state, activation, and appearance focus
retention. NativeWind appearance and Uniwind appearance/palette measurements
record zero XCTest hitches, with peak physical memory of about 561 MB and
518 MB. One measured iteration plus warmup does not prove long-run stability.
TypeScript and Uniwind also pass appearance/palette commands with iOS Reduce
Motion enabled. The setting is restored.

Parent PR #20 fixes the TypeScript example's navigation touch targets. Updated
signed apps build and open on both devices. All nine TypeScript effects pass
on Android and iOS. A subsequent Apple audit reports a clipped native Appearance
label. Follow-up automation times out before tests begin, including with a
clean runner; no speculative label fix is retained. NativeWind palette
performance, iOS capture latency, full iOS large-text/interruption checks,
TypeScript spoken VoiceOver, and spoken TalkBack remain open.

The temporary iPhone test runner is removed. TypeScript, NativeWind, and Uniwind
are installed and each launches. Android preferences are restored. RN package
tests, packed checks, fresh iOS/Android consumers, formatting, lint, and example
types pass after the touch-target fix. Hosted build/test steps pass on the
previous RN/Vue heads; only the production audit fails. The two high advisories
still list no patched versions. Publication remains blocked; nothing is published.

# Local verification — October 8, 2026

## Automated checks

- `uitheme-rn`: nine preference-store behavior checks pass. Scenarios were
  defined before implementation: system resolution, slow restoration, write
  ordering, invalid records, failures, snapshot identity, and subscription cleanup.
- Package build produces ESM, CommonJS, and declarations for all three entries.
- Packed-package smoke check installs a tarball into a clean temporary consumer.
  Both module formats execute the headless store. Public entries and declarations
  exist, and the core/provider entries do not import browser or Expo APIs.
  Native rendering uses public built workspace entries, not library source.
- Native package and example pass TypeScript, scoped ESLint, and formatting.
- Production bundles export successfully for iOS, Android, and web.
- Expo Doctor passes all 21 checks. Both native workspaces use SDK 57's
  TypeScript version. The local install was refreshed after fixing duplicate
  native-module peer contexts; no Doctor checks were disabled.
- The existing web package's four unit checks still pass.

## Rendered checks

On iPhone 16 Pro / iOS 18.6 in Expo Go for SDK 57:

1. Open Appearance. The native menu exposes System, Light, and Dark with the
   current option selected.
2. Select Dark, then Forest. The state reads `Dark · dark · Forest`.
3. Open Preview. The native back button, header, text, surface, and button use
   the selected mode and accent.
4. Press the native switch button. Appearance returns to Light.
5. Reload through Expo Go. Appearance restores `Light · light · Forest`.
6. Select System. Toggle the simulator appearance. The state becomes
   `System · dark · Forest`; toggle again and it becomes
   `System · light · Forest`. The simulator appearance is restored to Light.

The browser preview also restores Light/Forest after a reload, navigates to
Preview, and switches to Dark. A browser-rendered button warning found during
inspection was fixed by using Expo UI's `label` prop.

Local screenshots, generated under ignored `test-results/`:

- `ios-appearance-light.png`: System resolving to Light with Forest selected.
- `ios-preview-light.png`: native Preview in Light with Forest selected.

## Remaining device checks

These results do not establish release-build frame rate or touch feel on a slow
physical device. Android rendering, VoiceOver/TalkBack interaction, maximum
accessibility text sizes, landscape, background appearance changes, and live
Reduce Motion changes still need device checks. Implementation is not device
verification.

Use the acceptance checklist in README.md for the next device pass. At this checkpoint, nothing
had been published, pushed, or submitted to a store. See the later alpha
verification in `../../../docs/react-native-release-checks.md`.

## Optional transitions — October 8, 2026

The optional `uitheme-rn/reanimated` entry now runs color transitions on
participating Reanimated views and text. The duration is 180 ms. Native headers,
status bars, and Expo UI controls continue to use their platform APIs.

### Executed cases

On the same iPhone 16 Pro / iOS 18.6 simulator, using Expo Go SDK 57:

- Changed Dark to Light and Light to Dark on Preview. Native text, navigation,
  and the screen tree remain present. The recording contains intermediate
  background, surface, text, and accent colors.
- Double-tapped the appearance button. The recording shows the direction reverse
  before the first color change finishes. The latest requested mode wins.
- Selected Forest while retaining the appearance preference. Reloaded the app
  through Expo Go with Dark/Forest stored. The restored screen reads
  `Dark · dark · Forest`. The first mounted content uses the restored theme.
- Enabled Reduce Motion in Settings while the example remained mounted in the
  background. The returned Preview reads `Color transition: 0 ms`. Switching
  appearance changes the sampled background in one recorded frame. Disabling
  Reduce Motion and returning to Preview restores `Color transition: 180 ms`.
- Increased the simulator text size eight steps from its initial size. The title
  and body wrap and the screen scrolls. Captured the top and scrolled content.
  Restored the text size after the check. The exact accessibility category was
  not read, so this is a very-large-text check rather than a verified maximum.
- Rotated Preview to landscape. The content lays out horizontally and remains
  scrollable. Restored portrait orientation after the check.
- Selected System, backgrounded the app, and changed device appearance. Returning
  to the app reads `System · dark · Default`. The palette stays unchanged.
  Restored device appearance to Light.
- Native accessibility inspection exposes appearance options, selected state,
  palette labels, the navigation link, and the appearance button's target mode.
  This establishes exposed semantics, not screen-reader interaction.

The recording was sampled at 60 frames per second. In the normal recording,
content brightness progresses through several intermediate values around
7.77 seconds and 13.68 seconds. The rapid reversal appears around 28.63 seconds
and reverses around 28.77 seconds. In the reduced-motion recording, the theme
change at 5.48 seconds reaches the light background in one sampled frame. Later
motion in that recording belongs to the simulator's app switcher and Settings.
These samples establish rendered transitions; they are not a frame-rate benchmark.

Interpolating text and background colors temporarily lowers contrast in the
middle frames. Text animation is opt-in. For uninterrupted reading, consumers
can apply `transition.view` to surfaces and change text colors immediately.

### Artifacts

These local artifacts are ignored by Git:

- `test-results/theme-transitions.mp4`
- `test-results/transition-frames.png`: twelve consecutive recorded frames.
- `test-results/transition-frame-samples.json`
- `test-results/theme-reduced-motion.mp4`
- `test-results/reduced-motion-frame-samples.json`
- `test-results/theme-restoration.mp4`
- `test-results/transition-large-text.png`
- `test-results/transition-large-text-scrolled.png`
- `test-results/transition-landscape.png`

### Checks still requiring devices

No Android SDK or emulator is installed locally. The physical-device prerequisites were initially unavailable. See the later
physical-device setup result below. Android rendered transitions,
VoiceOver/TalkBack interaction, the verified largest accessibility category,
Reduce Motion enabled during the 180 ms transition itself, navigation/unmount
during that interval, and slow-device release performance remain unverified.
The acceptance cases and release profiling steps are recorded in the example.

The circular reveal was evaluated in `docs/react-native-architecture.md`.
Full-window capture, platform chrome, memory, interruptions, and accessibility
need a separate native experiment. The public API exposes color transitions.

## Physical-device setup result

The user connected an iPhone 15 Pro running iOS 27 and enabled Developer Mode.
The device tools confirm that development disk-image services are available.
The phone has no Expo Go installation. The release app was later installed; see
the signing result below.

Expo prebuild generated the ignored native project from `app.json` with bundle
identifier `com.tonyedgal.uithemenativeexample`. CocoaPods 1.16.2 was installed in
a temporary directory, without changing the global Ruby installation. Pod
installation completed. Expo Doctor passes 21/21 when run with that temporary
CocoaPods environment. A normal shell still needs CocoaPods on its PATH for
native tooling checks now that a native project exists.

The unsigned release build fails before compiling app code. `xcodebuild` reports
that no eligible iOS destination is available and that iOS 26.5 must be installed
through Xcode Components. Xcode 26.5's GUI also fails to open on macOS 27 with an
incompatible-application-version error. The Mac has no valid code-signing identity.
These are local tooling and signing blockers, not a verified application failure.

The local failure log is `test-results/ios-release-build.log`. A compatible Xcode
installation, its required iOS components, and a development signing identity are
needed before a signed release app can be installed. No signing certificate was
created. Release frame rate and physical VoiceOver checks remain pending.

## Physical-device signing result

Xcode was updated to 27.0 (27A266a), its license was accepted, and the user
configured a development team. The Mac now has a valid Apple Development identity.
A signed Release build succeeds for the connected iPhone 15 Pro. The build
required `ENABLE_USER_SCRIPT_SANDBOXING=NO`: the generated app target had enabled
script sandboxing, which denied Metro access to its bundle output. The setting
was supplied to this build without editing the generated project.

The app passes `codesign --verify --deep --strict` and device installation succeeds.
Launching is blocked by iOS with a security error naming an invalid signature,
entitlements, or a profile not yet trusted by the user. Local signature validation
passed; device trust is the next check. No rendered physical-device result or
release frame-rate result is established.

Artifacts: `test-results/ios-release-build.log`, `ios-device-install.json`, and
`ios-device-launch.json` under `test-results/`.

## iOS 27 startup crash and fix

After the user trusted the development profile, launch requests succeeded but the
app terminated immediately. The device produced repeatable startup crash reports.
The triggered frame is
`___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`,
with `EXC_BREAKPOINT` / `SIGTRAP`. The generated app used the legacy application
lifecycle and had no scene manifest. This is the iOS 27 scene-lifecycle requirement,
not a JavaScript theme failure.

Added SDK-compatible `expo-build-properties@~57.0.22` and enabled
`ios.enableSceneSupport` through its config plugin. Regenerated the ignored native
project and installed pods. The resulting app delegate conforms to
`ExpoReactNativeFactoryProvider`; the scene manifest points to
`EXExpoAppSceneDelegate`. Expo supplies window creation and scene event forwarding.

TypeScript, ESLint, source formatting, and Expo Doctor (21/21 with the temporary
CocoaPods environment) pass. The signed Release build succeeds with the existing
development team supplied as a build setting. Installation and launch succeed.
The device process remains running and the console reaches JavaScript evaluation.
The user confirms that the Appearance screen now opens on the physical iPhone.
This startup result does not establish transition frame rate or screen-reader
behavior.

The pre-fix device crash is saved as `test-results/ios-startup-crash.ips`. Current
launch output is in `test-results/ios-device-console.log`.

## Animated screen transitions — 2026-10-09

The optional `uitheme-rn/transitions` entry implements fade, circularReveal, wipe,
slide, split, heart, star, pixelize, and dissolve. Appearance and palette commands
use the existing store. The example exposes all nine effects on its Transitions
screen. The reference is [this Expo Snack](https://snack.expo.dev/@mariops03/react-native-theme-transition?platform=ios).

On an iPhone 16 Pro simulator running iOS 18.6, Expo Go renders all nine effects.
The recording shows intermediate frames and the final appearance or palette.
An initial button-origin failure attempted to serialize a React Native view ref
into a worklet. The corrected worklet captures only primitive uniforms and the
shared progress value. The repeated checks show no further serialization error.

Device Hub's Reduce Motion control updates the open screen to
`Reduce Motion: immediate changes`. Appearance changes from Clay/light to
Clay/dark, and palette changes from Clay to Forest, without starting the capture
path. Reduce Motion was restored afterward; the screen returns to `Ready`.

Package ESM/CJS builds and declarations, example TypeScript, scoped ESLint, nine
store tests, and the packed-consumer smoke check pass. The smoke check verifies
five public entries and that Skia remains optional for root/core consumers.
Expo Doctor passes 21/21 after installing Skia, with the temporary CocoaPods
environment available.
The production export passes for iOS, Android, and web. Web uses immediate changes
and does not construct a native runtime shader during server rendering.

The signed Release rebuild, physical iPhone installation, and launch succeed.
The physical rendering of these new effects has not yet been confirmed by the
user. This result does not establish release frame rate or memory use.

Artifacts under `test-results/`: `screen-effects.mp4` contains the corrected
simulator run, `screen-effects-frames.png` shows sampled effects, and
`screen-transition-frame-samples.json` records the sampling method. These are
functional evidence, not a performance benchmark. A capture taken while native
navigation was still moving includes displaced content; navigation/capture
overlap remains an acceptance case. Physical VoiceOver, Android rendering and
TalkBack, rotation/background stress, and release profiling remain pending.

## Navigation and interruption follow-up — 2026-10-09

Added an `enabled` prop to `UIThemeTransitionProvider`. Disabling it cancels the
overlay and makes new commands immediate. The example disables captures between
the native stack's `transitionStart` and `transitionEnd` events. Commands also
skip capture while AppState is not active. The Invert reveal switch now has an
explicit accessibility label, confirmed in the simulator's accessibility tree.

In Expo Go on the same iOS simulator, an appearance request followed by Back
returns to Appearance with the committed Light/Forest choice. Re-entering the
playground returns to Ready; selecting Clay starts another circular reveal and
returns to Ready. A theme request followed by Home and reopening the app returns
with the target preference and enabled controls. Landscape and portrait both
render with no leftover overlay. The recording does not establish that rotation
occurred before animation completion; deterministic rotation-during-capture
stress remains pending.

Artifacts: `test-results/screen-interruptions.mp4` records these actions and
`screen-interruption-final.png` shows the restored portrait screen. Builds,
declarations, packed-consumer checks, TypeScript, scoped ESLint, and production
exports for all platforms pass after these changes. The signed iPhone Release
rebuild succeeds. Physical screen-reader and performance checks, Android device
checks, and capture-failure/unmount stress remain unverified.

The new Release app installs and launches on the connected iPhone. A physical
Animation Hitches recording was attempted with Xcode 27's `xctrace`. Attaching by
app name or PID fails even though CoreDevice reports the running process. The
device-wide attempt reports `Device got disconnected, ending recording...`;
export fails with `Document Missing Template Error`. CoreDevice still reports
the phone as connected. No usable performance result was produced. The failure
log is `test-results/ios-screen-effects-profile.log`. The physical-effects
confirmation question remains unanswered.

## Autonomous stress checks — 2026-10-09

Used a temporary native route in Expo Go on the iPhone 16 Pro simulator. The
route was removed afterward; the normal Appearance link and library source were
restored byte-for-byte. The fixture and capture-fault patch remain as ignored
local artifacts under `test-results/`, outside the app's routes and package.

- Concurrent appearance/palette requests: the first request is accepted, the
  second is rejected, the palette stays unchanged, and the overlay clears.
- Thirty successive captured effects: every request completes; the original
  mode is restored after the even number of toggles; the screen returns to Ready.
- Resize during a ten-second effect: the target mode remains and the screen
  returns to Ready after changing the provider's height at 400 ms.
- Remove the provider at 400 ms during a ten-second effect, then remount: the
  committed target survives and the new provider starts at Ready.
- Rotate during a ten-second effect: the target survives and controls return to
  Ready before the requested effect duration ends.
- Enable Reduce Motion during a ten-second effect: the target survives and the
  overlay clears. Normal motion and portrait orientation were restored afterward.
- Inject an error on the initial capture and, separately, the target capture:
  both paths report the injected error, reach the target mode, and return to
  Ready. This verifies error handling through the running native app; it does
  not establish the frequency or causes of real capture failures.

`test-results/screen-stress-checks.mp4` records the test actions and result labels.
`transition-stress-route.tsx` and `capture-fault-injection.patch` preserve the
local probe. Reproduce by temporarily adding the fixture as a route, opening it
from Appearance, and applying the fault patch only for the two failure cases.
Set the fixture's fault counter to 1 for initial-capture failure and 2 for
target-capture failure. Restore all temporary source changes before building.
These results are functional checks in Expo Go, not a release memory benchmark.

VoiceOver was enabled in the simulator for an appearance effect. The live tree
exposes the control labels, selected values, and disabled buttons during playback,
without a duplicate set of controls from the snapshot. The screen returns to
Ready. The screenshot `test-results/simulator-voiceover.png` records the simulator
focus ring. VoiceOver was restored to off. Spoken output, gesture traversal, and
physical-device focus retention remain unverified.

Retried physical Animation Hitches recording after launching without console
attachment. Instruments still reports a device disconnection; no usable trace
was produced. The log is `test-results/ios-profile-retry.log`. Android SDK tools,
an emulator, and a connected Android device are absent on this Mac. Android
rendering and TalkBack therefore remain pending.

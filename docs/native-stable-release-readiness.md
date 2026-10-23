# React Native stable release readiness

The first stable release target is `uitheme-rn@1.0.0`. A major changeset sets
that target. The manifest stays at `0.1.0-alpha` and the npm tag stays `alpha`
until the release gates pass and Changesets versions the package.

## Compatibility fixes

The examples use Skia 2.11.1 to fix Android overflow capture. This deliberately
overrides Expo SDK 57's bundled version and requires custom native builds.
Animation peers are restricted to the tested Reanimated 4.5, Worklets 0.10,
Skia 2.11, and NativeWind 5 RC0 families. Wider RN and Expo ranges still need
equivalent device validation.

Fresh iOS archives build for all three examples. The latest NativeWind and
Uniwind builds install and launch on the connected iPhone. The user authorized removing Car Platform Demo. The latest TypeScript archive
is now installed and launches alongside NativeWind and Uniwind. Android Release builds install for all three examples with
Skia 2.11.1. Launch and bundle checks do not prove visual or spoken behavior.

## Release steps

1. Resolve the production dependency audit without suppressing advisories.
2. Complete iPhone effect, interruption, frame-time, and memory checks.
3. Complete VoiceOver speech, traversal, selected-state, and focus checks.
4. Complete Android rendering, interruption, large-text, and TalkBack checks.
5. Verify clean packed-package consumers and optional entries on both platforms.
6. Verify local checks and hosted CI for the RN PR before adding the Vue child PR.
7. Verify independent Changesets plans and unchanged private example versions.
8. Review pending web changesets before applying the release plan.
9. Apply Changesets versioning, refresh the lockfile, set stable publication
   tags to `latest`, and validate final archives and hosted CI.
10. After publication authorization, publish `uitheme-rn@1.0.0` and
    `uitheme-vue@1.0.0`. Check npm tags, provenance, and fresh consumers.

The Vue package remains a separate child PR. No Vue package or example belongs
in the RN PR. The release process builds libraries only during publication.
Normal CI still builds and checks the existing example apps.

## Local CI

Run the commands in `.github/workflows/release.yml` on the RN-only tree.
`pnpm test:release:native` installs a packed RN package outside the workspace,
checks strict root declarations without DOM libraries, installs optional peers,
and bundles all optional entries for iOS and Android. Optional declarations use
`skipLibCheck: true`; they do not prove all upstream declarations are strict.
Evidence is saved under `test-results/release-consumers-native/`.

The dependency audit remains a gate. The last audit reports two high advisories
in Expo tooling: node-forge and braces. No advisory is suppressed.

## October 23 device and CI follow-up

Hosted CI at `7a66037` passes formatting, lint, builds, types, unit/declaration
checks, packed checks, isolated native consumers, and browser regressions. Only
the production audit fails on the two disclosed high advisories. The upstream
advisories list no patched version.

Both Android styling apps pass nine-effect appearance and palette controls,
rapid-input settling, system-animation-disabled commits, and complete control
traversal at font scale 1.5. The TypeScript preview changes appearance in both
directions. TalkBack binds, but speech and focus traversal remain unverified.
Temporary device settings are restored after the checks.

Two unrecorded rounds show 16.59% janky frames in Uniwind and 19.68% in NativeWind,
with 129 ms 99th-percentile frame times. PSS rises across both rounds. Eight
awaited captures take 113–133 ms each; conversion is usually below 0.03 ms.
An independent source review finds no redundant capture or confirmed image leak.
Skia performs Android view traversal and bitmap copying on the main thread.
These results do not pass the performance gate. Diagnostic code was removed.

The iPhone test runner times out enabling automation. macOS developer-tool
authorization is disabled, and enabling it requires a pending system
authentication prompt. Physical iOS interaction and VoiceOver remain open.
The temporary test runner is removed and all three example apps are restored.

Device evidence remains under `test-results/device-release-2026-10-23/`.
Vue child PR #21 contains the combined review and its separate checks.

# React Native stable release readiness

The first stable release target is `uitheme-rn@1.0.0`. A major changeset sets
that target. The manifest stays at `0.1.0-alpha` and the npm tag stays `alpha`
until the release gates pass and Changesets versions the package.

The version wrapper runs standard Changesets versioning and refreshes the
lockfile. An isolated October 23 rehearsal selects only the RN changesets and
changes only RN to 1.0.0. A separate web-only rehearsal changes only web to
1.2.0. Private example versions stay unchanged. Neither rehearsal modifies
the working manifests or publishes a package.

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

1. Review the advisory production dependency audit and track upstream fixes.
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

The production dependency audit is advisory. CI runs the full audit and reports
failures as a warning and job summary without blocking release. Builds, types,
and tests remain required. The audit is not clean: it reports two high findings
in example tooling. No advisory is excluded from the report.

On October 23, npm still serves node-forge 1.4.0 and braces 3.0.3 as latest.
Neither advisory lists a patched release. The proposed
[node-forge fix](https://github.com/digitalbazaar/forge/pull/1152) remains open;
the [braces issue](https://github.com/micromatch/braces/issues/70) remains open.
Relaxing CI does not fix these vulnerabilities. No dependency override or
unreleased patch is added. Recheck upstream releases before the next update.

## October 23 device and CI follow-up

Hosted CI at `7a66037` passes formatting, lint, builds, types, unit/declaration
checks, packed checks, isolated native consumers, and browser regressions. Before the audit policy change, only
the production audit failed on the two disclosed high advisories. The upstream
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

macOS developer-tool authorization and iPhone UI Automation are enabled.
A fresh Xcode 27.1 test runner successfully exercises the physical iPhone:

- All nine effects pass appearance and palette control checks in all three apps.
- NativeWind and Uniwind pass Apple's accessibility audit. VoiceOver speaks the
  controls and selected state, activates appearance changes, and retains focus.
- NativeWind appearance and Uniwind appearance/palette measurements record zero
  XCTest hitches. Peak physical memory is approximately 561 MB and 518 MB,
  respectively. One measured iteration plus warmup is not a long-run memory
  stability test. Capture latency is not measured separately on iOS.
- TypeScript and Uniwind commit appearance and palette changes with the actual
  iOS Reduce Motion setting enabled. The setting is restored after the test.
- The TypeScript example's navigation links now have 44-point touch targets.
  Both devices run the updated example, and all nine TypeScript effects pass.

The TypeScript audit then reports a clipped Appearance label in the native
selector. This is an open release gate. Follow-up automation again times out
before tests start, including with a fresh runner. No audit finding is suppressed.
NativeWind palette performance, full iOS large-text traversal, TypeScript spoken
VoiceOver, iOS interruption checks, and spoken TalkBack still need completion.
The existing styling-app VoiceOver and performance results remain valid; the
later runner failure does not establish new results.

Device evidence remains under `test-results/device-release-2026-10-23/`.
Vue child PR #21 contains the combined review and its separate checks.

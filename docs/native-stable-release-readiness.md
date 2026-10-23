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
Uniwind builds install and launch on the connected iPhone. The latest
TypeScript archive has not been installed because the free signing profile
is at its development-app limit. Earlier TypeScript screenshots describe the
preceding build. Android Release builds install for all three examples with
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

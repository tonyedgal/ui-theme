# React Native alpha verification

2026-10-09

## Completed locally

- npm serves `uitheme-rn@0.1.0-alpha`. A clean consumer installs the published
  tarball. ESM and CommonJS core commands execute successfully. All seven public
  entries include declarations. Optional styling and animation peers remain
  optional. This check reads npm; it does not publish a new version.
- Nine native preference-store tests pass. The full workspace build, type checks,
  formatting check, and lint check pass. All three Expo examples export iOS,
  Android, and web bundles.
- Both styling examples offer all nine screen effects. The simulator checks and
  evidence are in each example's DEVICE-CHECKS.md. Palette checks are in the
  package's STYLING-CHECKS.md.
- The Uniwind signed Release app installs and opens on the connected iPhone.
  The NativeWind standalone simulator Release app builds and opens.

The shared root React types remain pinned to the web workspace's existing
19.3.0 version. Each Expo workspace keeps its SDK-compatible 19.2 types. This
prevents pnpm's hoisted fallback from changing web dependency declarations when
native workspaces are added. No web component changes are needed.

## Remaining device evidence

1. Release performance: record frame hitches, capture delay, and memory on the
   physical iPhone while changing appearance and palettes with every effect.
   Instruments attempts fail to attach or report a device disconnection. The
   latest Uniwind retry reports `Cannot find process matching name: UIThemeUniwind`.
   No usable frame-rate or memory result exists.
2. Physical VoiceOver: check spoken labels, selected values, gesture traversal,
   and focus retention after each transition. Accessibility tree inspection
   proves exposed semantics, not these spoken interactions.
3. Android: repeat palette, transition, interruption, large-text, and TalkBack
   checks on an Android device. Android SDK tools, an emulator, and a connected
   Android device are absent on this Mac. Android bundles export successfully;
   Android device rendering remains unverified.
4. Remote CI: push the reviewed local branch only after the user authorizes the
   push. Local checks do not establish a GitHub CI result.

Native navigation headers and system windows are outside the Skia capture
boundary. NativeWind uses v5 RC0; future releases require a compatibility check.

## Dependency audit blocker

`pnpm audit --prod` reports four advisories in the Expo/React Native dependency
tree: two high and two moderate. The CI audit remains enabled and fails until
these findings are resolved. The published package has only Zod as a direct
runtime dependency; these audit paths come from the native example apps.

- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv):
  node-forge 1.4.0 through Expo CLI and signing certificate tooling; no patched
  release is listed.
- [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  braces 3.0.3 through Metro and micromatch; no patched release is listed.
- [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq):
  uuid 7.0.3 through Xcode project tooling; the advisory lists 11.1.1 as patched.
- [decode-uri-component malformed input](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr):
  decode-uri-component 0.2.2 through Expo Router and query-string; the advisory
  lists 0.5.0 as patched.

Upstream-compatible updates need verification before replacing transitive APIs.
No advisory has been ignored, and this alpha is not marked release-ready.

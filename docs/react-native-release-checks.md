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
- Both Uniwind and NativeWind signed Release apps install and open on the
  connected iPhone. Both include native duration sliders for appearance and
  palette transitions. Physical screenshots confirm the installed controls.
  The NativeWind standalone simulator Release app also builds and opens.

The shared root React types remain pinned to the web workspace's existing
19.3.0 version. Each Expo workspace keeps its SDK-compatible 19.2 types. This
prevents pnpm's hoisted fallback from changing web dependency declarations when
native workspaces are added. No web component changes are needed.

## Remaining device evidence

1. Release performance: record frame hitches, capture delay, and memory on the
   physical iPhone while changing appearance and palettes with every effect.
   Earlier Instruments attempts failed to attach or reported a device disconnection.
   On October 12, a 15-second idle baseline attached to a current PID and exported
   successfully after the recording finished saving. This establishes a working
   trace path, not performance during effects. A later attempt used an expired
   PID and failed. Active runs need a freshly read PID and the test app in the
   foreground. Full effect frame-rate, capture delay, and memory checks remain.
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

As of October 12, `pnpm audit --prod` reports two high advisories in the
Expo/React Native dependency tree. The two moderate findings are fixed locally.
The CI audit remains enabled and fails until the high findings are resolved. The published package has only Zod as a direct
runtime dependency; these audit paths come from the native example apps.

- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv):
  node-forge 1.4.0 through Expo CLI and signing certificate tooling; no patched
  release is listed.
- [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  braces 3.0.3 through Metro and micromatch; no patched release is listed.
  Resolved on October 12:

- [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq):
  uuid 7.0.3 through Xcode project tooling is overridden to patched 11.1.1.
  Parsing an actual Xcode project and generating its UUID succeed.
- [decode-uri-component malformed input](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr):
  decode-uri-component 0.2.2 is overridden to patched 0.5.0. A two-line patch
  lets query-string 7.1.3 read either a CommonJS decoder or the new ESM default
  export. Query parsing, malformed percent input, encoding, all three native
  example exports, and workspace type checks pass.

The full workspace build, type checks, lint, formatting, and commit hooks pass
with the compatibility patch. No advisory has been ignored. The two high
findings still have no patched version listed; this alpha is not marked
release-ready. Physical VoiceOver speech and Android rendering/TalkBack still
need the requested human feedback and an Android test environment.

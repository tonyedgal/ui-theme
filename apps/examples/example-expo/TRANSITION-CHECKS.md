# Theme transition acceptance cases

Defined before the transition implementation.

1. Launch with a stored dark palette. The first frame uses the restored palette.
   No light-to-dark transition runs during restoration.
2. Change Light to Dark and back. Backgrounds, text, borders, and accents reach
   the requested colors. Text, focus, scroll position, and navigation survive.
3. Change palettes without changing appearance. Accent colors change smoothly.
4. Reverse appearance before the transition ends. The newest request wins.
   No delayed callback restores an older theme.
5. Turn Reduce Motion on while the screen is open. Changes become immediate.
   Turn it off. Subsequent changes animate again.
6. Turn Reduce Motion on during a transition. The final colors apply immediately.
7. Unmount the preview during a transition. No stale work changes the next screen.
8. Use System mode. Change device appearance while active and while backgrounded.
   The returned screen resolves the current device appearance.
9. Use VoiceOver or TalkBack. Controls retain labels, selected state, and focus.
10. Use the largest accessibility text size and landscape. Content remains
    readable and scrollable. No control depends on a fixed text height.
11. Run an iOS and Android release build on the slowest supported device.
    Record dropped frames and interruption behavior. Simulator checks alone do
    not pass this case.
12. Install the packed package without animation peers. Core and provider work.
    Install animation peers and import the separate animation entry.

Record each executed case, platform, and result in VERIFICATION.md. An export or
static check cannot establish rendered motion, accessibility, or frame rate.

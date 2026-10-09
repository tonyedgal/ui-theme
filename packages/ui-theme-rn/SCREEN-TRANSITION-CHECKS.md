# Screen transition acceptance

Define these checks before implementation. Run in a standalone release app.

- Light to Dark and back: the old screen remains covered until the new screen is
  ready; the selected appearance and saved preference agree after completion.
- Default to Forest to Clay: the same effect changes only the palette.
- Each effect: fade, circular reveal, wipe, slide, split, heart, star, pixelize,
  and dissolve reach the exact target screen without a leftover overlay.
- Origin: a control ref and explicit point locate the reveal in provider points.
- System: changing a palette preserves System; background OS changes still resolve.
- Restore: startup uses saved preferences without a screen capture or reveal.
- Reduce Motion: no capture when enabled; enabling it during a transition removes
  the overlay and keeps the current target.
- Busy: requests during capture or playback do not mutate preferences.
- Navigation, rotation, background, unmount, and capture failure: release images,
  restore touches, and retain the last committed preference.
- Disable the provider during native navigation: an active overlay is removed;
  a new choice applies immediately. Re-enable after navigation ends, then verify
  that the next effect captures the settled screen.
- Accessibility: snapshots are hidden; live controls remain the only semantic tree.
- Release: measure capture latency, frame hitches, and memory on iOS and Android.

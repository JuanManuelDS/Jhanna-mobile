# Spec for session-screen

branch: claude/feature/session-screen
figma_component (if used): Jhanna Timer (https://api.anthropic.com/v1/design/h/J1ShiRR06OfU3fMN1jJvxA?open_file=Jhanna+Timer.html)

## Summary

Build the **Active Session** screen of the Jhanna meditation app — the full-screen, distraction-free timer view that the user enters after tapping "Begin" on the Home screen. This is the second of the four app screens defined in CLAUDE.md and it must be **fully functional**, not a static mockup: it has to drive the actual two-phase timer (Preparation → Meditation), play bell sounds at phase transitions and on completion, support pause/resume and early-stop, animate the circular progress arc smoothly, and on natural completion record the session in AsyncStorage and navigate to the Session Complete screen.

The Home screen passes in the chosen `prepTime` and `meditationTime` (in minutes). The Session screen owns the countdown lifecycle for the duration of the visit.

## Functional Requirements

### Phase lifecycle
- The session has two sequential phases: **Preparation** (length = `prepTime`) and **Meditation** (length = `meditationTime`).
- The screen starts in the Preparation phase as soon as it mounts, with the timer already running.
- When Preparation reaches `0:00`, automatically transition to the Meditation phase, reset the countdown to `meditationTime`, play the start bell (`bell_start.mp3`) once, and update the phase label to "Meditation".
- When Meditation reaches `0:00`, play the end bell (`bell_end.mp3`) once, persist the completed session, and navigate to the Session Complete screen.
- If `prepTime` is 0, skip the Preparation phase entirely: start directly in Meditation, play the prep→meditation transition bell.

### Countdown timer display
- Large circular timer occupies the visual center of the screen.
- A circular progress arc wraps around the time numerals; the arc shrinks (or fills, per the design) from full to empty over the duration of the **current phase**, restarting at full when transitioning from Preparation to Meditation.
- Numeric time inside the circle shown as `M:SS` (e.g. `9:42`). Use minutes-and-seconds formatting; do not show hours.
- Time decrements every second. The arc animation should be smooth (driven by `react-native-reanimated`), not stepped per-second.
- Phase label rendered above (or as specified by the Figma) the circular timer: the literal string "Preparation" or "Meditation".

### Controls
- **Pause / Resume button**: toggles between the two states. Tapping pauses both the countdown and the arc animation; tapping again resumes from where it left off. The icon (and/or label) reflects the current state.
- **Stop button**: ends the session early. Tapping it records the session as completed but taking into account the meditated time, not setted time session; it returns the user to the Home screen. Show a subtle confirmation button before stopping.
- No other interactive elements (no settings, no menu, no back gesture handling beyond what React Navigation provides by default — but see Edge Cases).

### Audio
- Use `expo-av`. Preload both `bell_start.mp3` and `bell_end.mp3` on mount with `Audio.Sound.createAsync()`.
- `bell_start.mp3` plays exactly once at the Preparation → Meditation transition.
- `bell_end.mp3` plays exactly once when the Meditation phase completes.
- Unload sounds on unmount to free resources.
- Bells play even if the device is in silent mode is **out of scope** for this spec — use default `expo-av` behavior.

### Persistence on completion
When the Meditation phase reaches `0:00` or the meditation was stopped:
- If the session reaches `0:00` append a new entry to `sessions` in AsyncStorage with shape `{ date: "YYYY-MM-DD" (today, local time), duration: meditationTime, timestamp: Date.now() }`.
- If the session was stopped append a new entry to `sessions` in AsyncStorage with shape `{ date: "YYYY-MM-DD" (today, local time), duration: meditationTime-meditationLeft, timestamp: Date.now() }`.
- Recompute the streak per the rules in CLAUDE.md ("Streak Logic" section) and update `streak.current` and `streak.longest`.
- Then navigate to the Session Complete screen, passing `duration` and the updated streak so it can render without re-reading storage.

### Visual / styling
- Full-screen background in **deep warm brown** (`#A0654A` from the palette, used as the dominant background — a darker variant may be used if it matches the design).
- All foreground elements (numerals, arc, labels, control icons) use cream / warm gold tones from the palette so they read clearly against the dark brown.
- Use NativeWind classes for styling per project rules; no `StyleSheet.create` unless NativeWind cannot express something (e.g. SVG arc props).
- The circular arc itself is drawn with `react-native-svg` and animated via `react-native-reanimated`.
- Layout must feel calm and minimal — no progress text below the arc, no extra decorations beyond what the Figma shows.

## Figma Design Reference (only if referenced)
- File: Jhanna Timer (Anthropic-hosted design link in user prompt)
- Component name: Active Session / Timer screen
- Key visual constraints:
  - Deep warm brown full-bleed background
  - Centered circular timer with animated progress arc
  - Phase label ("Preparation" / "Meditation") rendered as a calm, light-colored text above the timer
  - Two controls (Pause/Resume, Stop), positioned per the design — likely below the timer
  - No status bar clutter, no streak counter, no navigation chrome — this screen is intentionally distraction-free

> Note: the design link returned encoded binary on fetch, so the implementer should open the URL directly to confirm exact spacing, icon shapes, and font weights before finalizing the visuals.

## Possible Edge Cases
- **`meditationTime` is 0**: should not be reachable from the Home screen, but if it is, do not record a session and return to Home.
- **App backgrounded mid-session**: out of scope for this iteration — when the app is backgrounded, the JS timer pauses naturally. We do not attempt to compensate for elapsed wall-clock time on resume. Document this as a known limitation in the implementation, not in user-facing UI.
- **Hardware back button (Android)**: treat the same as Stop — discard the session and return Home. Do not allow accidental dismissal that would also lose state silently; this matches the explicit Stop behavior.
- **Bell file fails to load or play**: log the error, do not crash, continue the timer. Audio is a nice-to-have, not load-bearing for the timer itself.
- **Phone goes to sleep / screen locks**: out of scope. Future iterations may use `expo-keep-awake`; this spec does not require it.
- **Pause held for a long time then resume**: timer must resume from exactly the remaining seconds at pause. No drift.

## Acceptance Criteria
- Tapping "Begin" on Home with `prepTime=1, meditationTime=10` lands on the Session screen showing "Preparation" and a `1:00` countdown that immediately starts decrementing.
- After 60 seconds, the bell plays, the label switches to "Meditation", the timer resets to `10:00`, and the arc restarts from full.
- After the meditation phase finishes, the end bell plays once and the user is auto-navigated to the Session Complete screen.
- The completed session appears in AsyncStorage under `sessions` with the correct date, duration, and timestamp; `streak.current` and `streak.longest` are updated per the rules in CLAUDE.md.
- Pause stops both the digits and the arc animation; resume continues from the exact remaining time with no visible jump.
- Stop returns to Home without writing to AsyncStorage and without playing the end bell.
- Skipping Preparation works when `prepTime = 0`: the screen opens directly in the Meditation phase with no transition bell.
- Background is deep warm brown; arc + numerals + label are legible; no extra UI is present beyond the timer, label, and the two controls.
- Implemented with functional components, NativeWind classes, Zustand for any shared state (timer state itself can stay local), `react-native-svg + reanimated` for the arc, and `expo-av` for audio — per CLAUDE.md.

## Open Questions
- Exact deep-brown shade: use `#A0654A` from the palette, or a darker custom shade (the CLAUDE.md description says "deep warm brown" which reads darker than `#A0654A`)? Confirm against the Figma.
- Does the design show a small phase progress indicator (e.g. "Phase 1 of 2") or just the label text? Default to label only unless Figma shows otherwise.
- The "Begin" button on Home currently exists — does it already navigate to a Session route, or is route registration also part of this work? Default: register the `Session` route in the existing stack as part of this spec.

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- A pure timer/state helper (extract the phase-transition logic into a testable function): given `prepTime`, `meditationTime`, and elapsed seconds, returns the correct `{ phase, remainingSeconds }`. Cover prep-only elapsed, transition boundary, mid-meditation, and completion.
- Pause/resume math: pausing for N seconds then resuming yields the same remaining time as if N seconds had not elapsed.
- Skip-prep behavior when `prepTime = 0`: phase starts as `meditation`, no transition event fires.
- Persistence on completion: a unit test for the "complete session" handler that, given an empty AsyncStorage, writes the expected session entry and updates streak fields per the CLAUDE.md rules (yesterday → today increments; gap day resets to 1).
- Stop during a session: handler does **not** write to AsyncStorage and does not update streak.
- Do not test the actual `expo-av` audio playback or the SVG arc rendering — assert the trigger points (e.g. that a `playStartBell()` was called at the transition) via mocks or function spies.

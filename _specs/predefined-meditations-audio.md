# Spec for predefined-meditations-audio

branch: claude/feature/predefined-meditations-audio
figma_component (if used): n/a

## Summary
Replace the current mocked list of predefined meditations on the Home screen with a real catalog backed by the audio files placed in `assets/audios/`. Each predefined meditation is now tied to an actual recording: a short instructional sitting and ten "Day N Chantings" sessions from the 10-day course. Selecting any of these and starting the session must play the linked audio at the right time, and must not play any bell sound during the session.

## Functional Requirements

### Catalog
- The "Predefined" tab on the Home screen must list exactly the following entries, in this order:
  1. **Short Instructions** — backed by `assets/audios/Short-Instr_English_Group Sitting_GroupSitting_Janani_2001.mp3`
  2. **Day 1 Chantings** — `assets/audios/Day01_Morning_Chantings_Chanting_10day.mp3`
  3. **Day 2 Chantings** — `assets/audios/Day02_Morning_Chantings_Chanting_10day.mp3`
  4. **Day 3 Chantings** — `assets/audios/Day03_Morning_Chantings_Chanting_10day.mp3`
  5. **Day 4 Chantings** — `assets/audios/Day04_Morning_Chantings_Chanting_10day.mp3`
  6. **Day 5 Chantings** — `assets/audios/Day05_Morning_Chantings_Chanting_10day.mp3`
  7. **Day 6 Chantings** — `assets/audios/Day06_Morning_Chantings_Chanting_10day.mp3`
  8. **Day 7 Chantings** — `assets/audios/Day07_Morning_Chantings_Chanting_10day.mp3`
  9. **Day 8 Chantings** — `assets/audios/Day08_Morning_Chantings_Chanting_10day.mp3`
  10. **Day 9 Chantings** — `assets/audios/Day09_Morning_Chantings_Chanting_10day.mp3`
  11. **Day 10 Chantings** — `assets/audios/Day10_Morning_Chantings_Chanting_10day.mp3`
- The current mocked entries (Morning Calm, Quick Reset, Deep Jhanna, Body Scan, Loving Kindness, Evening Wind-down) must be removed entirely. The card UI itself stays the same.

### Durations and audio scheduling
- **Short Instructions:**
  - The total meditation duration equals the duration of the linked audio file (rounded up to the nearest minute for display, but the session should end exactly when the audio finishes).
  - The audio starts playing the moment the meditation phase begins.
  - The session ends when the audio ends.
- **Day N Chantings (1–10):**
  - The total meditation duration is fixed at 60 minutes (1 hour) regardless of audio length.
  - The audio must finish exactly at the end of the session. It should therefore start at `(60 minutes − audio duration)` from the meditation phase start. Example: a 33-minute audio starts at minute 27 of meditation and ends at minute 60.
  - These audios will not last longer than an hour. The max duration is somewhere between 43 mins

### Preparation phase
- Predefined meditations still respect a preparation phase before meditation begins. Use the user's last manual preparation value, or a sensible default (e.g. 1 minute) if none is set, for all predefined meditations. Audio scheduling above is measured from the start of the meditation phase, not from the start of preparation.

### Bells
- No start bell, no end bell, and no phase-transition bell should sound during a predefined meditation session — neither preparation→meditation nor session-end. The on-screen ringing visual flourish tied to bells must also be suppressed for these sessions.
- Manual sessions are unaffected and continue to play the user's chosen bells.

### Audio playback behavior
- When the session is paused, the audio playback must pause. When resumed, it must continue from the same position.
- When the user stops the session early via the Stop confirmation modal, the audio must stop immediately and be unloaded.
- When the user backgrounds the app or navigates away from the Session screen for any reason, the audio must stop and be unloaded.
- Only one predefined audio can be playing at a time — switching meditations or starting a new session must not leave a previous audio still playing.

### Session-complete handling
- When a predefined session ends naturally (audio finishes for Short Instructions, or the 60-minute timer reaches zero for Day N), the session is committed exactly as it is today (full duration counts toward streak/history).
- Early-ended predefined sessions follow the same partial-session rule as manual sessions: any meditation time of at least 1 second is saved (rounded up to the nearest minute), and prep-only stops save nothing.

### Card display
- The predefined card should continue to show the meditation name and the meditation length in minutes. The "prep" sub-line should still appear and reflect the preparation length used. The mock `description` field is no longer required — drop it from the UI for these entries (or display nothing if empty).

## Figma Design Reference (only if referenced)
- Not applicable — UI layout is already in place; this feature only changes data, audio behavior, and bell suppression.

## Possible Edge Cases
- Audio file fails to load (corrupt, missing, permission issue): the session should still run on the timer alone, no audio, no crash. Surface no intrusive UI; just silently skip audio.
- Audio finishes a few seconds before or after the scheduled end of the 60-minute meditation due to floating-point or playback drift: the timer remains the source of truth for ending the Day N sessions; do not cut the timer short or extend it because of audio drift (Short Instructions is the only exception, where the audio defines the end).
- Pause during the silent pre-roll of a Day N meditation (i.e. before the audio's scheduled start time): the audio has not started yet, so only the timer needs to pause; when resumed, the audio still starts at the correct elapsed mark.
- Pause exactly at the moment the audio is scheduled to start: ensure the audio does not start playing while paused.
- User selects a predefined meditation, navigates away from Home, and returns: the previously selected meditation should remain selected (existing `lastPredefinedId` behavior must keep working with the new IDs).
- An older `lastPredefinedId` value persisted in storage no longer matches any of the new entries: treat as no selection.
- App is backgrounded during a Day N session and audio is mid-playback: audio should stop/unload (per requirement above), and on returning the user is taken back to Home (existing session-screen behavior).
- Very short audio for a Day N session (e.g. 5 minutes): the silent pre-roll is 55 minutes — confirm this is acceptable (or flag in Open Questions).

## Acceptance Criteria
- The Predefined tab shows exactly 11 entries in the order listed above; no mock entries remain.
- Selecting **Short Instructions** and starting the session begins playing the audio immediately when the meditation phase starts and ends the session when the audio ends.
- Selecting any **Day N Chantings** entry and starting the session runs a 60-minute meditation; the audio begins playing at `60 min − audio length` from the meditation phase start and finishes at the end of the session.
- No bell sounds (start, transition, or end) play during any predefined meditation session.
- Audio pauses/resumes with the session, stops on early end, and stops on navigation away from the Session screen.
- Manual sessions continue to behave exactly as before, including bell selection.
- The streak, history, and stats screens correctly record predefined sessions (full and partial) using the meditation length only, exactly as they do for manual sessions.

## Open Questions
- Should the Day N audio start time be computed once at session start using a precomputed audio duration, or read dynamically from the audio file's metadata at session start? (Affects whether we hard-code durations in the catalog or load them lazily.) - response: load them lazily
- Should the cards visually indicate "audio guided" vs. silent (e.g. a small headphones icon)? Currently not requested, but worth confirming. - response: no, out of scope for this.
- For Day N meditations where the audio is much shorter than 60 minutes, is a long silent pre-roll the desired experience, or should there be a soft cue when the audio is about to start? (Spec assumes silent pre-roll only.) - response: no soft que.
- Is the 1-minute default prep for predefined meditations correct, or should each predefined entry carry its own prep value? - response: for these predefined meditations make 30 seconds the default prep time
- Should the `lastPredefinedId` persistence be migrated/cleared given that the IDs are changing, or is silently falling back to "no selection" acceptable? - response: silent fallback

## Testing Guidelines
Create a test file (or files) in the `./tests` folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- The predefined catalog returns the 11 entries in the expected order, with the correct names and audio asset references, and "Short Instructions" first.
- For a Day N entry with a known audio duration, the computed audio start offset equals `60 min − audio duration` and the session length is 60 minutes.
- For Short Instructions, the session length equals the audio duration and the audio start offset is 0.
- A predefined session never schedules a start, transition, or end bell (verify the bell hook/util is not invoked or returns no-op for predefined sessions).
- Selecting a predefined meditation and beginning navigates to the Session screen with parameters that flag the session as predefined and carry the correct audio reference and timing.
- An early-ended predefined session saves a partial session of the meditated minutes (≥ 1 minute, rounded up); ending during prep saves nothing.
- A persisted `lastPredefinedId` that does not match any current entry is treated as no selection on Home screen mount.

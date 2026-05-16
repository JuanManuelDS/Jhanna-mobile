# Plan — Predefined Meditations Audio

Spec: [_specs/predefined-meditations-audio.md](../_specs/predefined-meditations-audio.md)
Branch: `claude/feature/predefined-meditations-audio` (already checked out)

## Context

The Predefined tab on Home today shows 6 hard-coded mock entries (Morning Calm, Quick Reset, etc.) that just route into the same manual session machinery — same bells, same timer, no audio. The mp3s for the real catalog have been dropped into [assets/audios/](../assets/audios/): one short instructional sitting and ten "Day N Chantings" tracks from the 10-day course.

This change makes those entries real:
- Replace the catalog with the 11 actual entries.
- Each predefined session plays its linked audio at the right time and is silent on bells (no audio bells, no visual ringing flourish).
- **Short Instructions:** session length = audio length; audio starts at meditation begin and *defines* session end.
- **Day N (1–10):** session length = 60 min fixed; audio starts at `60 min − audio duration` so it ends with the timer; timer is source of truth.
- 30s default prep for all predefined entries (per spec answer).
- Audio pauses/resumes with the session, stops on early end, stops on screen blur / backgrounding.

The session timer, partial-session save logic, streak/history, and Complete-screen flow all stay the same — predefined sessions feed `commitCompletedSession({ durationMinutes })` exactly like manual ones.

## Critical files

- **Edit:** [src/utils/predefinedMeditations.js](../src/utils/predefinedMeditations.js) — replace mock list with 11 real entries; new schema (`audio`, `kind`, no bells, no description, 30s prep, 60min for Day N); add `getPredefinedAudioDurationMs(id)` helper that loads → reads `durationMillis` → unloads, with an in-module cache.
- **Edit:** [src/screens/HomeScreen.js](../src/screens/HomeScreen.js) — drop bell params from predefined navigate; pass new `predefined` payload; preload Short Instructions duration when the Predefined tab is first shown so its card can display "X min"; treat unknown `lastPredefinedId` as no selection on mount.
- **Edit:** [src/components/PredefinedMeditationCard.js](../src/components/PredefinedMeditationCard.js) — drop the `description` line; allow `meditationTime` to be `null` (Short Instructions while loading) and render an em-dash placeholder; format prep correctly for 30s.
- **Edit:** [src/screens/SessionScreen.js](../src/screens/SessionScreen.js) — branch on a new `predefined` route param: suppress bells + ringing flourish, drive audio playback via a new hook, let Short Instructions end the session when the audio finishes, ensure audio is stopped/unloaded on stop / unmount / blur / background.
- **Create:** [src/hooks/usePredefinedAudio.js](../src/hooks/usePredefinedAudio.js) — new hook that owns the audio lifecycle (load → schedule start → pause/resume → stop/unload + AppState handling).
- **Edit:** [src/utils/session.js](../src/utils/session.js) — bump `DEFAULT_SESSION_DEFAULTS` only if needed; nothing in storage changes (silent fallback for stale `lastPredefinedId` per spec).
- **Edit:** [tests/predefinedMeditations.test.js](../tests/predefinedMeditations.test.js) — rewrite for the new catalog + helpers.
- **Edit:** [tests/HomeScreen.test.js](../tests/HomeScreen.test.js) — replace the "Morning Calm" assertions with the new entries; assert `predefined` payload shape on navigate.
- **Edit:** [tests/SessionScreen.test.js](../tests/SessionScreen.test.js) — add cases for bell suppression and audio scheduling.
- **Edit:** [tests/setup.js](../tests/setup.js) — extend the `expo-av` mock so `createAsync` returns a `status.durationMillis` and a `pauseAsync`/`playAsync`/`setOnPlaybackStatusUpdate` surface.

Reused (no edits):
- `useAppStore.commitCompletedSession({ durationMinutes })` — [src/store/useAppStore.js:24](../src/store/useAppStore.js#L24); predefined sessions commit identically.
- `phaseAt(prepSec, medSec, elapsedSec)` — [src/utils/timer.js](../src/utils/timer.js); unchanged.
- `useBells` — [src/hooks/useBells.js](../src/hooks/useBells.js); skipped entirely for predefined sessions (we don't render the hook).

## Design

### 1. Catalog schema ([predefinedMeditations.js](../src/utils/predefinedMeditations.js))

```js
export const PREDEFINED_KIND = { SHORT_INSTRUCTIONS: 'short', DAY_CHANTING: 'day' };

const PREP_SECONDS = 30; // per spec answer

export const PREDEFINED_MEDITATIONS = [
  {
    id: 'short-instructions',
    name: 'Short Instructions',
    kind: PREDEFINED_KIND.SHORT_INSTRUCTIONS,
    prepTime: PREP_SECONDS,
    meditationTime: null, // determined lazily from audio length, ceil to minutes
    audio: require('../../assets/audios/Short-Instr_English_Group Sitting_GroupSitting_Janani_2001.mp3'),
  },
  {
    id: 'day-1',
    name: 'Day 1 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day01_Morning_Chantings_Chanting_10day.mp3'),
  },
  // ... Day 2 ... Day 10 (same shape)
];

export function getPredefinedById(id) {
  if (id == null) return null;
  return PREDEFINED_MEDITATIONS.find((m) => m.id === id) ?? null;
}
```

**Why string IDs?** They're stable across reorderings and self-document the entry, and they make a stale persisted `lastPredefinedId` (e.g. legacy numeric `1`) cleanly fall through `getPredefinedById` → `null` → "no selection" without any migration code (per spec answer).

**Lazy duration helper** (same module):
```js
const _durationCache = new Map(); // id → ms
let _inflight = new Map();         // id → Promise<ms>

export async function getPredefinedAudioDurationMs(id) {
  if (_durationCache.has(id)) return _durationCache.get(id);
  if (_inflight.has(id)) return _inflight.get(id);
  const m = getPredefinedById(id);
  if (!m) return null;
  const p = (async () => {
    const { Audio } = require('expo-av');
    let sound;
    try {
      const created = await Audio.Sound.createAsync(m.audio, { shouldPlay: false });
      sound = created.sound;
      const status = created.status;
      const ms = status?.durationMillis ?? null;
      if (ms != null) _durationCache.set(id, ms);
      return ms;
    } catch (e) {
      console.warn('failed to read audio duration:', id, e);
      return null;
    } finally {
      if (sound) sound.unloadAsync().catch(() => {});
      _inflight.delete(id);
    }
  })();
  _inflight.set(id, p);
  return p;
}
```
Loads, reads `durationMillis`, unloads, caches. Inflight map prevents duplicate loads if HomeScreen + SessionScreen request it simultaneously. Returns `null` on failure → callers must tolerate (timer-only fallback).

### 2. HomeScreen wiring

Change the predefined-tab `useEffect`: when `activeTab === 'predefined'` *and* `selectedPredefId` corresponds to a Short-Instructions entry without a known minute count, fire `getPredefinedAudioDurationMs('short-instructions')` and store the result in local state (`shortInstrMin`). Cards already show `meditation.meditationTime` — for Short Instructions the card consults the resolved minute count instead. While unresolved, render `—` for the minute.

`handleBegin` for the predefined tab:
```js
const m = getPredefinedById(selectedPredefId);
if (!m) return;
const isShort = m.kind === PREDEFINED_KIND.SHORT_INSTRUCTIONS;
const audioMs = await getPredefinedAudioDurationMs(m.id); // may be null
const audioSec = audioMs ? Math.round(audioMs / 1000) : null;

const meditationTime = isShort
  ? Math.max(1, Math.ceil((audioMs ?? 0) / 60000))
  : 60;

navigation.navigate('Session', {
  prepSeconds: m.prepTime,
  meditationTime,
  predefined: {
    id: m.id,
    kind: m.kind,
    audio: m.audio,
    audioDurationSec: audioSec,                    // null on failure → silent fallback
    audioStartOffsetSec: isShort ? 0 : Math.max(0, 60 * 60 - (audioSec ?? 0)),
    endsWithAudio: isShort,
  },
});
```
*Trade-off:* `handleBegin` becomes async, which means a brief window where the user could double-tap. We'll guard with a `beginningRef` (similar to `endingRef` in SessionScreen) — second taps are no-ops until navigation fires. Will note in `ExitPlanMode`.

**Stale `lastPredefinedId`:** in the existing `useState` initializer, run `getPredefinedById(persisted) ? persisted : null` so an old numeric ID becomes `null` immediately and is also written back via `updateSessionDefaults({ lastPredefinedId: null })` on mount only if the persisted value was non-null and unrecognised.

### 3. PredefinedMeditationCard

Two trims and one fallback:
- Drop the `description` block entirely.
- `meditationTime` may be `null` → render `—` instead of the number.
- `formatPrep` already produces `30s prep` correctly via the existing `${seconds}s prep` branch — verified.

### 4. New hook: `usePredefinedAudio`

```js
useprefinedAudio({
  predefined,      // { audio, audioStartOffsetSec, endsWithAudio } or null
  isPaused,        // bool
  inMeditationPhase, // bool
  medElapsedSec,   // number — elapsed *within* meditation phase
  onAudioEnd,      // called when status.didJustFinish, used for Short Instructions
})
```

Lifecycle (single `useEffect` keyed on `predefined?.audio`):
1. **Load** at mount with `Audio.Sound.createAsync(audio, { shouldPlay: false })`. Stash in a ref. Set `setOnPlaybackStatusUpdate` to forward `didJustFinish` → `onAudioEnd`.
2. **Schedule start:** an effect on `[medElapsedSec, isPaused, inMeditationPhase]` checks: if not started yet, in meditation phase, not paused, and `medElapsedSec >= audioStartOffsetSec` → call `playAsync()`, mark `startedRef.current = true`. The `>=` (not `===`) protects us if the timer skips a tick.
3. **Pause:** effect on `[isPaused]` — if started and now paused → `pauseAsync()`. If started, was paused, and now resumed → `playAsync()`.
4. **Cleanup:** the effect's return runs on unmount or `audio` change → `stopAsync()` then `unloadAsync()`. AppState listener (separate effect) does the same on background → `inactive`/`background`.

Edge cases handled (matching the spec's list):
- Pause during silent pre-roll (Day N, before scheduled start): `startedRef` is still false → pause-effect no-ops. When resumed, the schedule-start effect fires next tick if `medElapsedSec >= offset`. ✅
- Pause exactly at the scheduled start moment: schedule-start effect is gated on `!isPaused`, so it won't call `playAsync` while paused. ✅
- Audio fails to load: `soundRef.current` stays null; all `playAsync`/`pauseAsync` calls become no-ops. Session runs silent on the timer. ✅
- Short Instructions audio drift: timer ignores; `onAudioEnd` (i.e. `didJustFinish`) is what ends the session. ✅
- Day N audio drift past 60 min: timer hits zero first, SessionScreen unmounts the hook, cleanup stops audio mid-play. ✅

### 5. SessionScreen changes

Pull the new param:
```js
const { prepSeconds, prepTime, meditationTime = 10, startBell, endBell, predefined } = route.params ?? {};
const isPredefined = !!predefined;
```

**Bell suppression:**
- Replace the `useBells({ startBell, endBell })` call with a conditional:
  ```js
  const bells = isPredefined
    ? { playStartBell: () => {}, playEndBell: () => {} }
    : useBells({ startBell, endBell });
  ```
  *Hooks-rules note:* React forbids conditional `useEffect`/hooks. Cleanest fix: a tiny `useNoopBells` that returns the no-op object without subscribing, then choose which hook by `isPredefined`. Both branches must be hooks called at the top level — so the actual implementation will always call **both** `useNoopBells` and `useBells` is wrong. Simpler: keep calling `useBells({ startBell: 'None', endBell: 'None' })` for predefined — `useBells` already short-circuits on `NONE_BELL` (no asset load, no playback). One hook, no conditional. The wrapper just maps `{ playStartBell, playEndBell }` to the same shape and doesn't play anything because `name === NONE_BELL` early-returns. Confirmed in [src/hooks/useBells.js:69-86](../src/hooks/useBells.js#L69-L86). This is the chosen approach.
- Skip the visual flourish (`ringBell()` calls and `setRinging(true)`) when `isPredefined`. Wrap both call sites:
  ```js
  if (!isPredefined) ringBell();
  ```
  in the phase-transition effect and on `phase === 'complete'`.

**Audio integration:**
Compute a derived `medElapsedSec`:
```js
const medElapsedSec = Math.max(0, elapsedSec - prepSec);
const inMeditationPhase = phase === 'meditation';
```
Call:
```js
usePredefinedAudio({
  predefined,
  isPaused,
  inMeditationPhase,
  medElapsedSec,
  onAudioEnd: handleAudioEnd,
});
```
Where `handleAudioEnd` only matters when `predefined?.endsWithAudio === true` (Short Instructions). It does the same thing today's natural-completion branch does:
```js
const handleAudioEnd = useCallback(() => {
  if (completedRef.current) return;
  completedRef.current = true;
  clearInterval(intervalRef.current);
  commitCompletedSession({ durationMinutes: meditationTime }).then((result) => {
    navigation.replace('Complete', {
      duration: result.duration,
      streakCount: result.streak.current,
      date: new Date().toISOString(),
    });
  });
}, [meditationTime]);
```
For Day N, `endsWithAudio` is false, so the existing `phase === 'complete'` branch is what ends the session — and it skips `ringBell()` / `playEndBell()` for predefined.

**Cleanup on blur / background:**
The hook's effect returns drive the `unloadAsync` on unmount. SessionScreen unmounts on:
- `navigation.replace('Complete', …)` → unmount → cleanup ✅
- `navigation.popToTop()` (early stop with no meditation seconds) → unmount → cleanup ✅
- `useFocusEffect` is for hardware-back, not blur — but the hook's own AppState listener handles background. We don't need to also tear down the timer on background; spec doesn't require it.

### 6. Storage / migration

No migration needed:
- The new `prepSeconds: 30` for predefined entries is per-session via route params; `settings.prepSeconds` (manual default) is left untouched.
- `lastPredefinedId` becomes string-typed; old numeric values are rejected at HomeScreen mount (silent fallback per spec). No storage write needed unless the user actively reselects.

### 7. Card-display details

Per spec, the card shows **name + meditation length in minutes + prep**. Concrete renders:
- `Short Instructions · — min · 30s prep` while loading
- `Short Instructions · 7 min · 30s prep` (example) once duration is resolved
- `Day 1 Chantings · 60 min · 30s prep` (no async)
- No description text under any.

## Tests

### `tests/predefinedMeditations.test.js` (rewrite)
- Catalog has exactly 11 entries.
- First entry is Short Instructions; entries 2–11 are Day 1 → Day 10 in order.
- Every entry has `id` (string), `name` (string), `kind`, `prepTime === 30`, and an `audio` reference (truthy).
- Day-N entries have `meditationTime === 60`; Short Instructions has `meditationTime === null`.
- `getPredefinedById(null/undefined/'unknown')` returns `null`.
- `getPredefinedById('day-1')` returns the matching entry.

### Audio-scheduling math (unit, in same file or new `tests/predefinedAudio.test.js`)
A small pure helper is worth extracting and testing without the hook's side effects:
```js
export function computeAudioStartOffsetSec(kind, audioDurationSec) {
  if (kind === PREDEFINED_KIND.SHORT_INSTRUCTIONS) return 0;
  if (kind === PREDEFINED_KIND.DAY_CHANTING) return Math.max(0, 3600 - audioDurationSec);
  return 0;
}
```
Tests:
- `computeAudioStartOffsetSec('day', 33 * 60) === 27 * 60` (spec example).
- `computeAudioStartOffsetSec('day', 43 * 60) === 17 * 60`.
- `computeAudioStartOffsetSec('short', 7 * 60) === 0`.

### `tests/HomeScreen.test.js` (edit)
- Replace `'Morning Calm'` references with `'Day 1 Chantings'`.
- Switching to Predefined tab and selecting Day 1 → tapping Begin navigates to `'Session'` with a `predefined: { id: 'day-1', kind: 'day', audio: …, endsWithAudio: false, audioStartOffsetSec: number, audioDurationSec: number|null }` payload and `meditationTime: 60`. Use `expect.objectContaining`.
- A persisted `lastPredefinedId` not in the catalog (`legacy-id`) does not visually preselect any card on mount.

### `tests/SessionScreen.test.js` (extend)
Add cases (using the existing mock of `useBells` and `expo-av`):
- A predefined route (with `predefined: { kind: 'day', audioStartOffsetSec: 600, endsWithAudio: false, audio: {} }`) does not call `playStartBell` or `playEndBell` and does not trigger the ringing visual (assert `PhaseLabel` mock receives `ringing: false` throughout).
- For a Short Instructions route, `onAudioEnd` (simulated via the mocked sound's `setOnPlaybackStatusUpdate` callback fired with `{ didJustFinish: true }`) → `commitCompletedSession` called once and `navigation.replace('Complete', …)` called once.

### `tests/setup.js` (extend)
Extend the `expo-av` mock so the test layer can drive playback events:
```js
Audio.Sound.createAsync = jest.fn(() =>
  Promise.resolve({
    sound: {
      playAsync: jest.fn(() => Promise.resolve()),
      pauseAsync: jest.fn(() => Promise.resolve()),
      stopAsync: jest.fn(() => Promise.resolve()),
      replayAsync: jest.fn(() => Promise.resolve()),
      unloadAsync: jest.fn(() => Promise.resolve()),
      setOnPlaybackStatusUpdate: jest.fn(),
    },
    status: { durationMillis: 7 * 60 * 1000 }, // 7-min stub
  })
);
```
Tests that need a different duration override the mock per-test.

## Verification

- `npm test` — full suite green.
- `npm test -- predefinedMeditations` and `npm test -- SessionScreen` and `npm test -- HomeScreen` — focused green.
- Manual smoke (`npx expo start` on device — UI changes need eyes):
  1. Open Home → Predefined tab → confirm 11 entries in spec order, no description sub-line, mock entries gone.
  2. Tap **Short Instructions** → "X min · 30s prep" shows once duration resolves. Begin → 30s prep (silent, no bell ring) → meditation phase starts and audio begins immediately → leave running until audio finishes → Complete screen shows the right duration; Stats shows the new session and streak incremented.
  3. Tap **Day 1 Chantings** → card shows "60 min · 30s prep". Begin → 30s prep → meditation phase begins in silence → wait long enough that the audio start offset hits → audio begins. Pause → audio pauses. Resume → audio resumes from same position. Stop → modal → End Session → audio stops + Complete screen with `ceil(meditatedSec/60)` partial minutes saved.
  4. Begin a Day session → tap hardware back during prep → modal → End Session → no session saved (prep-only). Confirm no audio leaked.
  5. Begin Short Instructions → background the app (cmd-H on iOS sim) → bring back → confirm audio is no longer playing (per spec) — exact return-to-Home behavior is preserved by existing screen behavior.
  6. Manual sessions: pick a manual prep + meditation + bells → verify start bell, transition bell, end bell, and the ringing visual still fire.

## Open items to confirm via `ExitPlanMode`

1. **HomeScreen `handleBegin` becomes async** because we need `getPredefinedAudioDurationMs` to compute the Short Instructions minute count (also caches for SessionScreen). Acceptable, with a `beginningRef` double-tap guard? Alternative: kick off the load on Predefined-tab mount and only enable Begin once the duration resolves (better UX feedback, slightly more code).
2. **String IDs vs numeric IDs** for predefined entries (`'short-instructions'`, `'day-1'`...). Spec allows either; strings make stale-value rejection cleaner. OK to break the persisted `lastPredefinedId` shape (silent fallback covers it)?
3. **Bell suppression via `'None'` rather than skipping `useBells`** — cleaner re hooks rules, relies on existing `NONE_BELL` short-circuit in `useBells`. Acceptable, or prefer a dedicated `useNoopBells`?
4. **Backgrounding behavior** — spec says stop+unload audio on background. Plan adds an `AppState` listener inside `usePredefinedAudio`. Should we also pop the user back to Home on background (the spec mentions "existing session-screen behavior" but the current screen doesn't actually do this), or leave that out of this change?

# Plan — Stop Button Confirmation Modal

Spec: `_specs/stop-button-confirmation.md`
Branch: `claude/feature/stop-button-confirmation` (already checked out)

## Context

Today, the Active Session screen's Stop button uses an inline two-tap confirmation: tap 1 turns the button into "End session?" with a 3-second auto-cancel; tap 2 ends the session. The spec replaces this with a centered modal popup featuring a blurred backdrop, "End Session?" title, supporting copy, and stacked Continue / End Session buttons — making the act of ending a meditation feel intentional and calm.

A second, related change: confirming "End Session" must save the partial session and route the user to the **Session Complete** screen (today's behavior already does this when `meditatedMinutes ≥ 1`, but the spec broadens "partial" to include sub-minute meditations and updates `CLAUDE.md` to acknowledge partial sessions in the data model).

The pill button styling already matches the design mock — only minor verification needed; the bulk of the work is the modal, the back-handler refactor, the partial-session rules, and tests.

## Critical files

- **Edit:** `src/screens/SessionScreen.js` — replace inline confirmation with modal state; rewire `handleStop` / `handleStopConfirm` / `handleContinue`; preserve pre-stop pause state; route hardware back through modal
- **Edit:** `src/components/SessionControls.js` — drop the inline `confirmingStop` two-tap behavior; Stop is now a one-shot trigger
- **Create:** `src/components/StopConfirmModal.js` — new component (RN `Modal` + `expo-blur` `BlurView` backdrop + reanimated fade/scale)
- **Edit:** `.claude/CLAUDE.md` — note partial sessions in the data model + streak logic sections (per spec Open Questions answers)
- **Create:** `tests/SessionScreen.test.js` — component tests for the new flow
- **Edit:** `package.json` — add `expo-blur` dep

Reused (no edits):
- `useAppStore.commitCompletedSession({ durationMinutes })` — `src/store/useAppStore.js:` already saves session + updates streak; partial sessions just call this with the elapsed-meditation duration
- `phaseAt(prepSec, medSec, elapsedSec)` — `src/utils/timer.js` for current phase / remaining
- `useBells()` — `src/hooks/useBells.js`; bells stay quiet because `isPaused` already gates the tick effect (see `SessionScreen.js:40-49`)

## Design

### 1. New component: `StopConfirmModal`
Uses RN's built-in `<Modal transparent animationType="none">` with `onRequestClose` (handles Android back). Inside:
- `BlurView` from `expo-blur`, `intensity={30}`, `tint="dark"`, plus an absolute-fill `View` with `backgroundColor: 'rgba(30,22,16,0.65)'` for the warm overlay tint per spec
- `Pressable` over the backdrop → calls `onCancel` (= Continue)
- Centered card: `width: 280`, `borderRadius: 20`, `backgroundColor: '#F5E6D3'` (cream), soft dark shadow
- Coral-tinted square icon block at top (`#D4796A` 15% opacity bg, stop glyph from `@expo/vector-icons` Ionicons `square`)
- Title `End Session?` (warm brown `#A0654A`, weight 500)
- Supporting text `Your progress for this session will be saved.` (warm brown, lighter weight)
- Two **stacked, full-width** buttons with ~10px gap:
  - Primary: filled coral `#D4796A`, label `End Session`, cream text → calls `onConfirm`
  - Secondary: transparent w/ 1px cream-outline (border `#F5E6D3` over the cream-card looks invalid — instead use `#A0654A` low-opacity border per design palette), label `Continue`, warm-brown text → calls `onCancel`
- Card animates in via `Animated.View` (reanimated) — opacity 0→1 + scale 0.96→1, 220ms `Easing.out(Easing.cubic)`. Backdrop fade 180ms.
- A `Pressable` with `pointerEvents` stops bubbling so taps on the card don't trigger the backdrop dismiss.

Props:
```js
{ visible, onConfirm, onCancel }
```
Stateless; parent owns `visible`.

### 2. `SessionScreen` rewiring

State changes:
- Remove `confirmingStop` and `confirmTimerRef`.
- Add `stopModalVisible` (bool).
- Add `wasPausedBeforeStopRef` (ref) — captures `isPaused` at the moment Stop was tapped, so Continue restores the prior state (handles edge case: user paused, then taps Stop, then Continue → stays paused).
- Add `endingRef` (ref) — guards against double `commitCompletedSession` from rapid double-tap on End Session.

Handlers:
```js
handleStop()        // pause + open modal; remember prior pause state
handleContinue()    // close modal; resume only if not previously paused
handleEndSession()  // commit partial session + navigate; guarded by endingRef
```

Partial-session rule (per spec answers):
- `meditatedSec = Math.max(0, elapsedSec - prepSec)`
- If `meditatedSec > 0`:
  - `durationMinutes = Math.max(1, Math.ceil(meditatedSec / 60))` — give credit for sub-minute meditations so they show in stats and count toward streak
  - `commitCompletedSession({ durationMinutes })` then `navigation.replace('Complete', …)`
- If `meditatedSec === 0` (user stopped during prep): no save, `navigation.popToTop()`. *Trade-off note:* spec popup says "Your progress will be saved" — saving a 0-minute session is meaningless, so we save nothing in this edge case. Will flag this in `ExitPlanMode` for confirmation.

Hardware back button:
- Currently `useFocusEffect` calls `handleStopConfirm()` directly on back, which immediately ends the session. This contradicts the spec ("back gesture mid-session → show popup").
- New behavior: back press →
  - If `stopModalVisible` → close modal as Continue, return `true`
  - Else → call `handleStop()` (open modal), return `true`

### 3. `SessionControls` simplification
- Drop `confirmingStop` and `onStopConfirm` props.
- Stop button is one-shot: `onPress={onStop}`, label always `Stop`, accessibility label always `Stop`.
- Pause button keeps its current toggle.
- Keep `PulsingText` PAUSED indicator — already matches spec.
- Existing styles (pill 28px radius, terracotta/coral with colored shadow, scale-0.95 pressed) already match the design mock; no style changes needed.

### 4. `CLAUDE.md` update
Two small edits to keep doc/code in sync:
- **Data Model section:** add a note that `sessions[]` may include partial sessions ended early via the Stop confirmation, with `duration` representing meditation time only (preparation excluded).
- **Streak Logic section:** add a line "Partial sessions (ended early) also count toward the streak."

## Tests

New file: `tests/SessionScreen.test.js`. Use existing patterns from `tests/HomeScreen.test.js`:
- Mock `react-native-safe-area-context`, `useAppStore`, `react-navigation` navigation via stub object with `replace`/`popToTop` jest.fn()s
- Mock `expo-blur` (passthrough View) in `tests/setup.js`
- Use `jest.useFakeTimers()` for the 1s tick interval

Cases (one `it` each, kept lightweight per spec testing guidance):
1. Pause toggles label `Pause` ↔ `Resume` and stops the tick (advance fake timers, assert `elapsedSec` text frozen).
2. Tap Stop while running → modal becomes visible; tick is frozen (advance 5s of fake timers, assert remaining-seconds text unchanged).
3. Tap Continue → modal hidden; tick resumes from same value.
4. Tap modal backdrop → behaves identically to Continue (modal hidden, tick resumes).
5. Tap End Session twice rapidly → `commitCompletedSession` called exactly once; `navigation.replace('Complete', …)` called once.
6. Tap Stop *while already paused* → Continue keeps it paused (assert pause label still says `Resume`, no tick).
7. Style assertion: Pause button bg `#E8936A`, Stop button bg `#D4796A`, both `borderRadius: 28`.

## Verification

- `npm test -- SessionScreen` — new tests pass.
- `npm test` — full suite passes (existing tests unaffected).
- Manual smoke (`npx expo start`):
  - Start a 1-min prep + 2-min meditation session
  - During prep: tap Stop → modal opens → Continue → timer resumes from same second
  - During meditation past 1min: tap Stop → End Session → land on Complete screen with partial duration; verify Stats screen lists the partial session and streak incremented
  - Pause, then Stop, then Continue → still paused
  - Press Android back during session (or use Expo Go's back gesture sim) → modal opens; press back again → modal closes
  - Verify backdrop blur renders on iOS + Android

## Open items to confirm via `ExitPlanMode`

1. Stopping during preparation (0 meditation seconds elapsed): save nothing & go Home, vs. save a 0-minute session & go to Complete?
2. Sub-minute meditations: round up to 1 min so they count toward streak and show in stats?
3. Add `expo-blur` dependency for the backdrop blur (small, official Expo package), or use only the dark translucent overlay without blur?

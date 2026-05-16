# Plan — Keep App Alive in Background

Spec: [_specs/keep-app-alive-background.md](../_specs/keep-app-alive-background.md)
Branch: `claude/feature/keep-app-alive-background` (already checked out)

## Context

Today the session timer in [src/screens/SessionScreen.js](../src/screens/SessionScreen.js) ticks via `setInterval(..., 1000)` against React local state (`elapsedSec`). The bell only fires inside a React `useEffect` that watches `phase`. Audio is configured with `staysActiveInBackground: false` in [App.js:35-39](../App.js#L35-L39).

Practical consequence: turn off the screen and the JS thread suspends within seconds on Android. The interval stops, the phase-transition effect never runs, and the bell never plays. When the user returns, the timer also shows the wrong remaining time because it advanced only while the JS thread was awake.

This change makes a session a piece of work the OS knows about and protects:

- A **foreground service** (sticky notification) keeps the JS context alive while a session is running.
- A pair of **exact alarm-triggered notifications** scheduled at session start act as the real source of truth for the prep-end bell and the session-end bell — they fire even if the JS thread is fully suspended.
- The in-app timer is rewritten to be **timestamp-anchored**: it derives elapsed time from `Date.now() - sessionStartedAt - pausedMs`, so returning from background always shows correct remaining time with no jump.

Scope per decisions taken: Android only this iteration (iOS reliability gap documented), library is **Notifee**, dev-client / prebuild is acceptable. Static notification text (phase + "in progress") — no live-updating countdown.

## Critical files

**Create**
- [src/services/sessionService.js](../src/services/sessionService.js) — orchestrates: start FG service, schedule bell alarms, pause/resume (cancel + reschedule remaining), stop (cancel everything + dismiss notification). Pure module, no React.
- [src/services/notifee.js](../src/services/notifee.js) — thin wrapper around Notifee: channel setup, FG service registration, `createTriggerNotification` helpers, cancel-by-id. Centralises every notifee call so the rest of the code stays unaware of the library.
- [src/utils/sessionClock.js](../src/utils/sessionClock.js) — pure helpers: `computeElapsedSec({ startedAt, pausedAccumMs, pauseStartedAt, now })`, `computeBellTimestamps({ startedAt, prepSec, medSec })`. All time math goes here so it's unit-testable.
- [src/hooks/useSessionClock.js](../src/hooks/useSessionClock.js) — React hook that drives the on-screen 1 Hz tick by reading the store's `sessionStartedAt`/`pausedAccumMs` and recomputing `elapsedSec`. Re-syncs on `AppState` change → `active`.
- `plugins/withForegroundService.js` — Expo config plugin that injects the `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS`, `WAKE_LOCK`, `SCHEDULE_EXACT_ALARM`, and `USE_EXACT_ALARM` permissions plus the `<service ... foregroundServiceType="mediaPlayback" />` entry in `AndroidManifest.xml`. Registered from `app.json` so prebuild stays reproducible.
- [tests/sessionClock.test.js](../tests/sessionClock.test.js)
- [tests/sessionService.test.js](../tests/sessionService.test.js) (with notifee mocked)

**Edit**
- [src/screens/SessionScreen.js](../src/screens/SessionScreen.js) — strip `setInterval` + local `elapsedSec`; derive `elapsedSec` from `useSessionClock`. Replace direct `playStartBell`/`playEndBell` calls in the phase-transition effect with `sessionService.start()` on first mount and `sessionService.stop()` on stop/complete/unmount. Keep `useBells` only for the *in-foreground* bell flourish (visual ringing + audible play when the app is visible) — the OS notification owns the screen-off case.
- [src/store/useAppStore.js](../src/store/useAppStore.js) — add new slice `activeSession`: `{ startedAt, prepSec, medSec, pausedAccumMs, pauseStartedAt | null, isPredefined, bellSound }` plus actions `beginSession`, `pauseSession`, `resumeSession`, `clearSession`. Not persisted — purely transient session state, but living in the store lets `SessionScreen` rehydrate after backgrounding/relaunch within the same process.
- [App.js](../App.js) — set `staysActiveInBackground: true` and (Android) `interruptionModeAndroid: INTERRUPTION_MODE_ANDROID_DO_NOT_MIX` so the bell routes through the alarm-style audio stream. Call `notifee.createChannel(...)` once at startup for the `meditation-bell` (importance HIGH, custom sound) and `meditation-session` (importance LOW, no sound — for the sticky FG service notification) channels. Register a Notifee background event handler at the module level (per Notifee docs).
- [app.json](../app.json) — add `expo-build-properties` if needed (Android `minSdkVersion`/`compileSdkVersion` bumps Notifee requires), `expo-notifications` is NOT added; add the new `withForegroundService` plugin path; declare the two bell sound assets so EAS bundles them. Bump `android.permissions` (mirrors what the plugin injects, kept for documentation).
- [src/hooks/usePredefinedAudio.js](../src/hooks/usePredefinedAudio.js) — drop the AppState `background`-stop logic ([usePredefinedAudio.js:94-110](../src/hooks/usePredefinedAudio.js#L94-L110)). With `staysActiveInBackground: true` the guided-audio track should continue when the screen turns off, matching the spec's "app finishes what it started" promise.
- [tests/SessionScreen.test.js](../tests/SessionScreen.test.js) — replace `setInterval` assumptions with store-driven elapsed; assert `sessionService.start` is called with correct payload on mount, `sessionService.stop` on stop/complete; assert no double-bell from in-foreground + scheduled bell collision.
- [tests/setup.js](../tests/setup.js) — add `jest.mock('@notifee/react-native', ...)` returning chainable jest.fns for `createChannel`, `displayNotification`, `createTriggerNotification`, `cancelNotification`, `cancelTriggerNotification`, `stopForegroundService`, `registerForegroundService`, `onForegroundEvent`, `onBackgroundEvent`. Mock `Linking.openSettings` for the "open battery optimization" prompt path.

**Reused, no edits**
- `phaseAt(prepSec, medSec, elapsedSec)` — [src/utils/timer.js](../src/utils/timer.js). Still the single source of truth for "what phase am I in"; the *input* (`elapsedSec`) just comes from `sessionClock` now instead of `useState`.
- `commitCompletedSession({ durationMinutes })` — [src/store/useAppStore.js:24](../src/store/useAppStore.js#L24). Called from `SessionScreen` exactly as today on the completion path.
- `useBells` — [src/hooks/useBells.js](../src/hooks/useBells.js). Still loads + plays the bell when the app is in the foreground; the screen-off case is covered by the scheduled notification's `sound` field, so we deliberately accept that an open-app session plays the bell twice for a fraction of a second — handled below.

## Design

### 1. Timestamp-anchored timer

Store keeps `{ startedAt: ms, pausedAccumMs, pauseStartedAt }`. `computeElapsedSec` returns the right value for any `now`:

```js
export function computeElapsedSec({ startedAt, pausedAccumMs = 0, pauseStartedAt = null, now }) {
  if (startedAt == null) return 0;
  const livePauseMs = pauseStartedAt != null ? Math.max(0, now - pauseStartedAt) : 0;
  return Math.max(0, Math.floor((now - startedAt - pausedAccumMs - livePauseMs) / 1000));
}
```

`useSessionClock` ticks a `useState` once per second purely so React re-renders; the *value* always comes from `computeElapsedSec`. On `AppState` → `active` it triggers an immediate recompute so the visible time snaps to truth without waiting for the next tick.

### 2. Bell scheduling (the part that survives screen-off)

At `sessionService.start({ startedAt, prepSec, medSec, bellSounds })`:

1. `notifee.requestPermission()` — if denied, surface a one-time warning banner on the session screen (acceptance criteria #14) but keep going.
2. `displayNotification` for the sticky session notification on the LOW-importance `meditation-session` channel, marked `asForegroundService: true`, with `ongoing: true`, `autoCancel: false`, body = "Preparation" / "Meditation in progress" (no live countdown), tap action = deep-link back into `Session` screen.
3. `createTriggerNotification` twice on the HIGH-importance `meditation-bell` channel (importance `IMPORTANCE_HIGH`, custom sound = the selected bell asset):
   - prep-end at `startedAt + prepSec * 1000`
   - session-end at `startedAt + (prepSec + medSec) * 1000`
   Trigger type: `TriggerType.TIMESTAMP` with `alarmManager: { allowWhileIdle: true }` — this maps to `setExactAndAllowWhileIdle`, the only way to fire reliably under Doze.

If `bellSound === NONE_BELL` (or the session is `predefined` with no bell), skip step 3 for that bell — the spec already treats predefined sessions as silent on bells.

### 3. Pause / resume

- Pause: cancel both trigger notifications (`cancelTriggerNotification`), record `pauseStartedAt = Date.now()`, update FG notification body to "Paused".
- Resume: compute `pausedAccumMs += Date.now() - pauseStartedAt`, recompute trigger timestamps from the *new* effective `startedAt + pausedAccumMs`, re-create trigger notifications.

### 4. Stop / complete

- `sessionService.stop()` cancels both trigger notifications and calls `stopForegroundService()` — the sticky notification disappears immediately, satisfying the spec's "tap stop in app → notification gone right now".
- On natural completion the second alarm has already fired the bell; the React phase-effect runs (if app foreground) and navigates to `Complete`. If the app is background when complete time arrives, the alarm-fired notification is what the user sees; tapping it deep-links to `Session`, which immediately detects `phase === 'complete'` and routes to `Complete`. No double-save: `completedRef` guard from [SessionScreen.js:99](../src/screens/SessionScreen.js#L99) is moved into the store as `activeSession.completedAt` so it survives a deep-link round-trip.

### 5. Avoiding the double-bell

When the app is foreground at the exact moment a scheduled bell fires, both the in-app `useBells.playEndBell()` and the OS notification sound would play. Approach: on `notifee.onForegroundEvent` for the bell notification, immediately `cancelNotification` it so Android stops the sound, and let `useBells` provide the audible cue. Both bell paths are idempotent already.

### 6. Audio mode

`Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true, interruptionModeAndroid: 1 /* DO_NOT_MIX */ })`. The notification's bell sound is delivered by the OS via the notification channel, which uses the *alarm* stream when the channel is configured with `AudioAttributes.USAGE_ALARM` — set this on `meditation-bell` channel creation so the bell is audible regardless of media volume (matches the spec's "respect silent mode but loud" lean).

### 7. Battery-optimization onboarding

First time the user starts a session, check `notifee.getPowerManagerInfo()`. If `activity` reports the device has aggressive power management (Xiaomi/Huawei/etc.), show a one-time modal explaining the issue with a button that calls `notifee.openPowerManagerSettings()`. Persist a `seenBatteryOptPrompt: true` flag in the store/AsyncStorage so it never re-shows.

### 8. Edge-case handling map

| Spec edge case | Where handled |
|---|---|
| Reboot mid-session — accepted loss | No persistence of active session across process restart; documented |
| Force-stop — accepted loss | Same |
| Swipe app from recents — keep running | FG service keeps process alive |
| Battery die — accepted loss | Documented |
| Phone call during session | Audio mode `DO_NOT_MIX` automatically pauses our audio; timer keeps running because it's clock-based not audio-based |
| Bluetooth bell routing | Inherited from notification channel using SYSTEM_DEFAULT routing |
| Lock 5 min into 10 min session | `computeElapsedSec` returns truth on `AppState → active` |
| Lock past session end | Deep-link from completed alarm → SessionScreen sees `phase==='complete'` → routes to Complete |
| Multiple bells from drift | Only one trigger notif per transition; `useBells` calls are idempotent on `replayAsync` |
| Two sessions back-to-back | `sessionService.stop()` is awaited before next `start()`; unique notification IDs per session UUID |

## Verification

Unit tests (run via `npm test`):
- `sessionClock.test.js` — paused/resumed/serialized cases per spec's Testing Guidelines bullet 1; arbitrary-`now` phase computation (bullet 2); bell trigger timestamp helper (bullet 3); notification content builder (bullet 4); cleanup cancels both alarms (bullet 5).
- Updated `SessionScreen.test.js` confirms `sessionService.start` and `.stop` are called at the right moments with notifee fully mocked.

Manual Android device checklist (the part unit tests cannot cover — runs once on a real device):
1. Start 2-min session (10 s prep), lock screen for 2 min — both bells audible, notification visible throughout, returning to app shows Complete screen.
2. Start session, swipe from recents, wait full duration — bells still ring, tapping bell notification lands on Complete.
3. Enable battery saver, repeat #1 — bells within ~1 s of target.
4. Start session, open Chrome and use phone for 5 min — bell fires on time, our notification visible in shade.
5. Lock 5 min into 10 min meditation, unlock — timer reads ~5 min remaining (not 10).
6. Stop from in-app stop button — sticky notification disappears immediately.
7. With "Do Not Disturb" on — bell audible because channel is set to bypass DND via `bypassDnd: true` on the bell channel.
8. Deny notification permission at first run — session still starts, banner warns about bell reliability, no crash.

Build steps:
- `npx expo prebuild --clean` after adding the config plugin
- `npx expo run:android` to produce a dev-client build
- Document the new build flow in README (added `npm run dev:android` script optional)

## Out of scope (acknowledged, documented in README)

- iOS reliable background bell (spec's open question accepted as "Android only now")
- Live-updating countdown in notification (spec leaned static)
- Pause/resume action buttons inside the notification (spec marked nice-to-have)
- Persisting an active session across full process restarts (spec's accepted-loss list)

# Spec for keep-app-alive-background

branch: claude/feature/keep-app-alive-background

## Summary

Ugh. App go sleep. Bell no ring. Caveman sad.

Me sit on rock. Close eyes. Breathe. Phone screen go black. Android god angry, Android god kill app. Bell never come. Me open eyes mad. Meditation broken.

We fix. App must stay awake like fire at night. Even when screen dark. Even when battery low. Even when many other app fight for food. Our app must keep ticking, keep counting, keep ring bell when time come.

App must finish what app start. Always.

## Functional Requirements

- App keep run when screen turn off
- App keep run when phone go in pocket
- App keep run when battery low (no doze, no nap, no nothing)
- App keep run when other app open on top
- Timer keep count down even when app not on screen — when caveman come back, timer show correct time, not wrong time
- Preparation-to-meditation bell MUST ring at right moment, even if screen off
- Final bell MUST ring at right moment, even if screen off
- Bell sound play loud enough to hear, even when phone in pocket
- Bell play even if phone in silent mode? (open question — see below)
- When app come back to foreground, UI show right phase and right time left, no jump, no glitch
- Show small notification in status bar while session run, so Android know app important and caveman see "still running"
- Notification show phase name (Preparation / Meditation) and time left, update as time tick
- Notification have button to stop session from notification (nice to have)
- Tap notification bring caveman back to active session screen
- When session done, notification go away on its own
- When caveman stop session, notification go away right then
- Work on Android first (main caveman platform). iOS behavior described in open questions
- No drain battery when no session running — only stay awake during active session

## Figma Design Reference (only if referenced)

Not used. No new screens. Only a notification card that follow Android system style.

## Possible Edge Cases

- Phone reboot mid-session — session lost, no bell. Document as accepted loss. Do not try recover
- Caveman force-stop app from Android settings — session lost. Accepted. Nothing we can do
- Caveman swipe app away from recent apps list during session — session MUST keep running (notification keeps it alive)
- Battery die mid-session — session lost. Accepted
- Phone call come in during meditation — pause bell, resume after? Or duck audio? Decide in open questions
- Other meditation app or music app playing — our bell still plays, but should not stop other audio (use proper audio focus / mix mode)
- Bluetooth headphones — bell route to headphones, not speaker
- Caveman start session, lock phone, unlock 9 minutes later — timer shows ~1 minute left, not 10 minutes
- Caveman start session, lock phone, wait 30 minutes (way past end) — when unlock, session already complete, final bell already rang, complete screen showing OR notification shows "complete"
- Doze mode kicks in after long screen-off — bell still fires at exact second
- App Standby Buckets put us in "rare" bucket — must still fire alarm
- Notification permission denied by caveman — fall back gracefully, warn caveman bell may not ring reliably
- Battery optimization "on" for app — warn caveman on first run to turn off, give one-tap link to settings
- Audio interrupted by another app at the moment bell tries to play — bell should still play, even if briefly ducking other audio
- Two sessions back to back — first session notification fully cleaned up before second starts
- Caveman opens stats screen mid-session — session keeps running in background, returns correctly
- Multiple bells queued (edge case from timer drift) — only ring once per transition

## Acceptance Criteria

- Start session, turn off screen, wait full duration → preparation bell rings at right time, final bell rings at right time, both audible
- Start session, turn off screen, put phone face down on table for full duration → both bells still ring
- Start session, swipe app from recent apps → notification stays, bells still ring
- Start session with battery saver on → bells still ring at correct time (within 1 second of target)
- Start session, open another app (browser, etc.), keep using phone → bells ring on time, our notification visible
- Lock phone for 5 minutes during a 10-minute meditation, unlock → timer shows roughly 5 minutes remaining (not 10), session in correct phase
- Persistent notification visible during whole session, gone when session ends or is stopped
- Tapping notification opens active session screen, not home screen
- Stopping session from in-app stop button clears notification immediately
- No background work happening when no session is active (verify with Android battery usage stats showing app as low/no usage outside sessions)
- App still installs and runs in Expo managed workflow (or we switch to bare/dev-client and document why)
- First-time caveman sees a friendly prompt explaining why notification permission is needed
- If notification permission denied, app still tries best effort and shows a warning on the timer screen

## Open Questions

- Should bell play in silent mode? - response: yes
- On incoming phone call: pause session, duck bell, or just let call interrupt and keep timer running? - response: let call interrupt and keep timer running
- iOS support: iOS does not allow true background timers the same way. Options: (a) skip iOS, Android only; (b) schedule local notifications with sound at exact times as fallback; (c) use background audio mode with silent audio loop (App Store risky). Decide before implementing - response: option A, this app is for android only.
- Do we need expo-dev-client / bare workflow, or can we do this fully in managed Expo? Likely need: `expo-notifications`, `expo-task-manager`, `expo-background-fetch`, `expo-keep-awake`, plus a foreground service plugin. Confirm versions and compatibility with current Expo SDK - response: decide this yourself
- Should notification show a live-updating countdown, or just static "Meditation in progress"? Live countdown costs more battery and is more code. Lean toward static text + phase name to start, upgrade later if wanted - response: "Meditation in progress" is fine
- Should notification be dismissible by swipe? Android foreground service notifications are usually non-dismissible while service runs — accept this behavior - response: no, it should not be dismissible.
- Do we use `setExactAndAllowWhileIdle` AlarmManager for the bell trigger (most reliable on Doze), or rely on the foreground service timer loop? Likely both: foreground service for UI + alarm as belt-and-suspenders for the bell - response: whatever you think is the most robust approach.
- Wake lock: do we hold a partial wake lock during the whole session, or only fire wake at bell times? Whole session is simpler but uses more battery. Lean toward: whole session for simplicity (sessions are short, typically <30 min). - response: sessions will be around 1 hour, sometimes 2 hours.
- Notification channel importance level — needs to be HIGH for sound but not so high it pops up a heads-up notification every tick. Choose carefully
- Where does pause/resume from notification fit? Nice to have, not blocking - response: not needed, a notification that says "Meditation in progress" and when you tap on in it goes to the app.

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Unit test: timer state can be paused, resumed, and serialized/deserialized correctly so background-to-foreground rehydration shows correct remaining time
- Unit test: given a session start timestamp and duration, helper correctly computes current phase (prep / meditation / complete) and time remaining for any "now"
- Unit test: bell scheduling logic — given prep time and meditation time, returns correct absolute trigger timestamps for prep-end bell and session-end bell
- Unit test: notification content builder returns correct text for each phase
- Unit test: session cleanup on stop / complete cancels any pending alarms and clears notification state in the store
- Manual test checklist (in spec or README, since real background behavior cannot be unit-tested): the acceptance scenarios above, run on a real Android device with battery saver on, with screen off, with app swiped away

# Spec for predefined-meditation-open-ended

branch: claude/feature/predefined-meditation-open-ended

## Summary
When a predefined meditation session reaches the end of its configured meditation duration, the app currently plays the ending bell and then automatically navigates to the Session Complete screen. This feature changes that behavior so that the ending bell rings to signal the configured duration has elapsed, but the timer keeps running and the session remains active. Only the user can end the session, by pressing the stop control. This gives the meditator freedom to sit longer than the prepared duration without the app cutting them off, while still being notified at the originally planned end point.

## Functional Requirements
- When a predefined meditation session's meditation phase reaches 00:00, the ending bell sound plays exactly once.
- After the bell plays, the session does NOT auto-navigate to the Session Complete screen.
- The countdown UI transitions into a continued / overtime state where the timer keeps progressing rather than freezing at zero, so the user has a visible signal that they are still meditating.
- Pause / resume continues to work during the overtime period.
- The session only ends when the user explicitly presses the stop control and confirms via the existing "End Session" confirmation modal.
- On user-initiated stop, the session is saved using the existing partial-session logic, and the app navigates to the Session Complete screen as before.
- The duration recorded for the session should reflect the actual meditation time the user spent, not just the originally configured meditation time (so overtime counts toward the saved session length).
- Preparation phase behavior is unchanged: prep ends, prep bell plays, meditation phase begins on its normal countdown.
- Streak logic is unchanged: a session that crosses the original end mark and is then user-stopped still counts toward the streak just like any completed/partial session.

## Possible Edge Cases
- User pauses the timer exactly at 00:00 or during the bell — bell should still play once, and resume should continue into overtime without replaying the bell.
- User stops the session before the original end time — existing partial-session behavior applies, ending bell does not play (it only fires at the original end mark).
- User stops the session exactly at the original end time — bell plays and the Session Complete screen should still appear via the user-initiated stop flow without double-saving.
- App is backgrounded around the moment the original end time is reached — bell behavior should match the existing keep-app-alive-background handling; the timer should still be in overtime when the app returns to foreground.
- Very long overtime (e.g. user sits for an extra hour) — timer display must not overflow visually, and the recorded duration must remain accurate.
- Sub-minute overtime — saved duration should follow the existing rounding rule (sub-minute meditation rounded up to 1 minute), applied to total elapsed meditation time including overtime.

## Acceptance Criteria
- Starting a predefined meditation and letting it run past the configured meditation time results in the ending bell ringing once and the timer continuing to run.
- The Session Complete screen is only shown after the user presses stop and confirms.
- A session stopped during overtime is saved with a duration equal to the actual meditation time the user spent (original meditation time + overtime), following existing rounding rules.
- A session stopped before the original end time behaves exactly as it does today (no ending bell, partial session saved per existing rules).
- The current streak and longest streak update correctly for sessions that include overtime.
- No regressions to preparation-phase behavior, pause/resume, or background audio behavior.

## Open Questions
- Should the timer in overtime count up from 00:00 (showing elapsed overtime), or keep displaying 00:00, or show total elapsed meditation time? A visible count-up is the most informative but is a UX decision. - response: count from 00:00
- Should the visual style of the countdown change during overtime (e.g. arc color shift, subtle indicator) to make it obvious the original duration has passed? - response: no, don't change it.
- Does this new behavior apply ONLY to the predefined meditations referenced in the user request, or to ALL meditation sessions started from the Home/Timer Setup screen? (The wording "predefined sessions" suggests there may be a distinction worth confirming.) response: it applies to all of the meditations.
- Should the ending bell be repeated at any later interval if the user stays in overtime for a long time, or strictly play only once at the original end mark? - response: play just once, don't repeat not even once.

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Meditation phase reaches zero: ending bell triggers once, session is not auto-completed, timer state continues to advance.
- User stops during overtime: saved session duration equals original meditation time plus the overtime elapsed (with rounding applied).
- User stops before the original end time: behavior matches existing partial-session flow (no ending bell, correct partial duration saved).
- Pause and resume during overtime: timer correctly resumes; bell is not replayed on resume.
- Streak updates correctly for a session that ran into overtime and was user-stopped.

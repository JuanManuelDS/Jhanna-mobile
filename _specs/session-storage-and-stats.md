# Spec for Session Storage and Statistics

branch: claude/feature/session-storage-and-stats

## Summary
Implement the core data persistence layer of the app: saving completed meditation sessions to AsyncStorage, computing streaks, and surfacing real session data on the Statistics screen. This replaces any mocked data currently in the app with live, device-stored records.

## Functional Requirements
- After a session completes (time reaches to 0 and session was stopped, if session was stopped calculate the meditated time (timeSetAtTheBeggining-timeLeftToReach0)), persist a session record to AsyncStorage containing: date (YYYY-MM-DD), duration (in minutes), and timestamp (Unix ms).
- On app load, read stored sessions, settings, and streak data from AsyncStorage into the Zustand store.
- Streak logic on session save:
  - If no session exists for today, check if the user meditated yesterday. If yes, increment current streak. If no, reset current streak to 1.
  - If a session for today already exists, do not change the streak.
  - Update longest streak whenever current streak exceeds it.
- The Statistics screen must display real data from the store:
  - "Current Streak" stat card shows the live current streak value.
  - "Longest Streak" stat card shows the live longest streak value.
  - "Total Sessions" stat card shows the count of all stored sessions.
  - Bar chart shows actual daily meditation minutes aggregated per day for the last 14 days (days with no sessions show 0).
  - Scrollable session history list shows all stored sessions sorted by most recent first, each entry showing the formatted date and duration.
- Settings (prepTime, meditationTime) must be saved to AsyncStorage whenever the user changes them on the Home screen, and loaded back on app start.
- Provide a utility function for streak calculation that is pure and testable in isolation.
- Provide a utility function for aggregating sessions into the 14-day bar chart data that is pure and testable in isolation.

## Figma Design Reference (only if referenced)
N/A

## Possible Edge Cases
- First-ever launch: no data in AsyncStorage; all stats default to 0, streak to 0.
- User completes multiple sessions in one day: streak should only increment once; total minutes for that day accumulate in the chart.
- User skips one or more days: streak resets to 1 on next completed session.
- Session saved at 23:59 and another at 00:01 the following day: each must land on the correct calendar date.
- AsyncStorage read fails on load: app must not crash; fall back to empty/default state.
- AsyncStorage write fails on session save: handle error gracefully without corrupting existing data.
- Very large session history (hundreds of entries): scrollable list must not block the UI thread.

## Acceptance Criteria
- Completing a session on the Active Session screen writes a record to AsyncStorage immediately.
- Reopening the app after a session shows updated streak and session count on the Home screen and Stats screen.
- Statistics screen bar chart reflects real aggregated minutes for the last 14 days, not hardcoded values.
- Session history list on the Statistics screen is populated from stored sessions, sorted newest first.
- Streak increments correctly when sessions are completed on consecutive days.
- Streak resets to 1 when a full calendar day is missed.
- Longest streak persists across app restarts.
- Settings values (prepTime, meditationTime) survive app restarts and are pre-loaded on the Home screen.
- No mocked or hardcoded session data remains in any screen component.

## Open Questions
- Should sessions shorter than the full configured duration still be saved? (e.g., user stops early) — response: yes, they shoudld be saved, calculating the time already meditated
- Is there a maximum number of sessions to retain, or do we keep all of them indefinitely? response: keep all of them indefinitely

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Streak calculation: first session ever → streak = 1
- Streak calculation: session today after session yesterday → streak increments
- Streak calculation: session today after missing yesterday → streak resets to 1
- Streak calculation: second session same day → streak unchanged
- Streak calculation: longest streak updates only when current exceeds it
- 14-day chart aggregation: sessions on various days aggregate minutes correctly
- 14-day chart aggregation: days with no sessions produce a 0-value entry
- 14-day chart aggregation: sessions older than 14 days are excluded

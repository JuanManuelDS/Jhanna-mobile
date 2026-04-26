# Spec for Project Folder Structure

branch: claude/feature/project-folder-structure
figma_component (if used): N/A

## Summary

Scaffold the complete folder and file structure for the Jhanna meditation timer app as described in CLAUDE.md. This includes creating all directories under `src/`, the navigation config, Zustand store, screen files, shared components, utility helpers, and asset placeholders — so the project is ready for feature development from day one.

## Functional Requirements

- Create `src/screens/` with one file per screen: `HomeScreen.js`, `SessionScreen.js`, `CompleteScreen.js`, `StatsScreen.js`
- Create `src/store/` with `useAppStore.js` (Zustand store skeleton with settings, sessions, and streak state)
- Create `src/components/` with placeholder files for reusable components: `TimePicker.js`, `StatCard.js`
- Create `src/navigation/` with `AppNavigator.js` (React Navigation stack config connecting all four screens)
- Create `src/utils/` with `streakUtils.js` (streak calculation helpers) and `dateUtils.js` (date formatting helpers)
- Create `src/assets/` as the target directory for `bell_start.mp3` and `bell_end.mp3` (audio files to be added manually)
- Each screen and component file should export a minimal functional component stub so the app can boot without errors
- The Zustand store should define the full data shape matching the data model in CLAUDE.md (settings, sessions, streak)
- The navigation file should register all four screens with appropriate names

## Figma Design Reference (only if referenced)

N/A

## Possible Edge Cases

- The `src/assets/` folder may need a `.gitkeep` if no audio files are committed yet, to ensure the directory is tracked
- If Expo's `app.json` or `babel.config.js` already references paths, the new structure must be consistent with those references
- NativeWind requires a `tailwind.config.js` at the root pointing to `src/**` — verify the glob covers the new structure

## Acceptance Criteria

- Running `npx expo start` (or equivalent) after scaffolding produces no import or missing-module errors
- All four screens are reachable via the navigator (even if they render only a placeholder view)
- The Zustand store can be imported in any screen without error and exposes `settings`, `sessions`, and `streak` fields
- `src/utils/streakUtils.js` exports at least `calculateStreak` and `updateLongestStreak` functions (stubs are fine)
- `src/utils/dateUtils.js` exports at least a `formatDate` function (stub is fine)
- No unnecessary files outside the defined structure are created

## Open Questions

- Should `src/assets/` hold only audio, or also images/icons? (CLAUDE.md mentions bell sounds only — clarify if icons will live here too)
- Are there any existing files at the root level (e.g. `App.js`) that need to be updated to point to the new `AppNavigator`?

## Testing Guidelines

Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- `useAppStore` initializes with the correct default values for settings, sessions, and streak
- `calculateStreak` in `streakUtils.js` returns 0 for an empty sessions array
- `formatDate` in `dateUtils.js` returns a correctly formatted string for a known timestamp
- `AppNavigator` renders without throwing (smoke test)

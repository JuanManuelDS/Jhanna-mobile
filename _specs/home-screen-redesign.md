# Spec for Home Screen Redesign with Bell Sounds and Predefined Meditations

branch: claude/feature/home-screen-redesign
figma_component: home-page-v2.html

## Summary

Redesign the home screen to include two distinct meditation setup modes: a "Manual" mode with improved time input controls, and a "Predefined" mode with pre-configured meditation templates. The redesign also introduces bell sound selection for session start and end, with options dynamically loaded from the assets/bells folder. The time input system should allow both increment/decrement buttons and direct numeric entry (typing) for faster configuration.

## Functional Requirements

### Tab Navigation
- Two tabs: "Manual" (primary) and "Predefined"
- Tab switching should be instant with no animation lag
- Active tab highlighted with underline indicator
- Each tab maintains independent state

### Manual Mode Tab
- **Preparation Time Picker**
  - Input in seconds (not minutes)
  - Default: 60 seconds
  - Range: 5–600 seconds (10 sec to 30 min)
  - Display format: "MM:SS" (e.g., "01:30" for 90 seconds)
  - Controls: +/− buttons for 10-second increments
  - **Direct numeric input**: Tapping the time display opens an editable text field where users can type seconds directly (e.g., "120" for 120 seconds)
  - Use the native only-numbers keyboard
  - Input validation: reject non-numeric input, clamp to min/max range

- **Meditation Time Picker**
  - Input in minutes
  - Default: 10 minutes
  - Range: 1–240 minutes
  - Display format: "10 min"
  - Controls: +/− buttons for 1-minute increments
  - **Direct numeric input**: Tapping the time display opens an editable text field where users can type minutes directly
  - Use the native only-numbers keyboard
  - Input validation: reject non-numeric input, clamp to min/max range

- **Bell Selection Row** (two columns, side-by-side)
  - "Beginning bell" dropdown: Bell sound that plays when preparation ends and meditation begins
  - "Finishing bell" dropdown: Bell sound that plays when meditation ends
  - Options: dynamically populated from `assets/bells/` folder by filename without extension (Aguda, Grave, Larga, Media, Suave, plus "None" for silence)
  - Default: First available option (likely Aguda for start, Grave for finish — or user-configurable defaults)
  - Store user's last selections in AsyncStorage under `settings.startBell` and `settings.endBell`
  - Each time the user taps on a bell the sound of it should play.

### Predefined Mode Tab
- **Scrollable list of pre-configured meditation templates** (mocked data for now)
  - Each card displays:
    - Name (e.g., "Morning Calm")
    - Duration (e.g., "10 min")
    - Prep time (e.g., "1 min prep" or "30s prep")
    - Description/tagline (e.g., "Gentle start")
  - Card is tappable to select
  - Selected card has visual highlight (border color change, background shift, checkmark)
  - Only one predefined meditation can be selected at a time

- **Predefined Data Structure** (mocked example, no backend yet)
  ```
  {
    id: 1,
    name: "Morning Calm",
    prepTime: 60,      // in seconds
    meditationTime: 10, // in minutes
    startBell: "Aguda",
    endBell: "Grave",
    description: "Gentle start to your day"
  }
  ```
  - Include at least 6 preset meditations covering a variety of durations and use cases (e.g., quick reset, extended practice, body scan, loving kindness, evening wind-down)

### Begin Button Behavior
- Button is **enabled only if**:
  - Manual tab is active (always ready), OR
  - Predefined tab is active AND a meditation is selected
- Tapping Begin navigates to the session screen with the selected parameters (prep time, meditation time, start bell, end bell)
- Button text: "Begin Session"
- Button styling: Terracotta background (#E8936A), white text, shadow for depth

### Data Persistence
- Save user's last-selected values:
  - Last preparation time (seconds)
  - Last meditation time (minutes)
  - Last selected predefined meditation (if any)
  - Last bell selections
- Restore on app launch (pre-populate time pickers and selection)
- Store in AsyncStorage under `settings` and `sessionDefaults` keys

## Design Reference

File: `_specs/design-assets/home-page-v2.html`
- Color palette: Cream background (#F5E6D3), tan accents (#C8A96E), terracotta buttons (#E8936A), warm brown text (#A0654A)
- Typography: DM Sans for labels, DM Serif Display for prominent numbers
- Spacing: 20px horizontal padding, 12–14px gaps between sections
- Tab box height: 290px with scrollable predefined list
- Bell dropdowns: Two-column layout, custom styling with chevron icon

## Possible Edge Cases

- **Empty bell selection**: If no bell files exist in `assets/bells/`, show a fallback "None" option or graceful error message
- **Direct input edge cases**:
  - User types "999999" — clamp to max range
  - User leaves field empty — default to previous value or minimum
  - User types non-numeric characters — reject or strip them
  - User types "0" for meditation time — reject (minimum 1 minute)
- **Predefined with custom bells**: If a predefined meditation specifies a bell file that no longer exists, fall back to a default or "None"
- **Tab switching while in direct input**: Closing/opening the numeric input when switching tabs should save or discard the value appropriately
- **AsyncStorage unavailable**: Gracefully handle if AsyncStorage read/write fails (show default values, log error)
- **First-time user**: No previous selections saved — show sensible defaults (1 min prep, 10 min meditation, first available bell)

## Acceptance Criteria

- [ ] Home screen displays two tabs: "Manual" and "Predefined"
- [ ] Manual tab has preparation time input (in seconds, MM:SS format) with +/− buttons and direct numeric input
- [ ] Manual tab has meditation time input (in minutes) with +/− buttons and direct numeric input
- [ ] Bell dropdowns in manual mode are populated with actual bell filenames from `assets/bells/`
- [ ] Predefined tab displays at least 6 mocked meditation templates with selectable cards
- [ ] Only one predefined meditation can be selected; selection is visually highlighted
- [ ] Begin button is disabled until manual mode is ready or a predefined meditation is selected
- [ ] Begin button navigates to session screen with correct parameters
- [ ] User's last selections (prep time, meditation time, selected predefined, bells) persist across app restarts
- [ ] Direct numeric input works: tapping time value opens text field, user can type, value is validated and clamped to range
- [ ] All styling matches home-page-v2.html design (colors, typography, spacing)
- [ ] App is responsive and works on various phone sizes (tested on 320px and 430px widths minimum)

## Open Questions

- Should the default bell selections be hardcoded, or inferred from available files? response: inferred
- For predefined meditations: should they eventually load from a backend/CMS, or remain hardcoded forever? response: it'll remain hardcoded just for now, later we'll do it but without the need of a backend server.
- Should users be able to create and save their own meditation templates, or only use predefined ones? response: for now, they'll use only predefined ones.
- When switching between tabs, should the Begin button's readiness state be re-evaluated visually (highlight/disabled state)? Response: yes
- Should preparation time also support minute input (e.g., "5 min") or strictly seconds? response: in case the user puts 120 secons then display 2 minutes.

## Testing Guidelines

Create test files in the `./tests` folder for the new feature:

- **Time Picker Tests**:
  - Increment and decrement buttons work correctly within bounds
  - Direct numeric input accepts valid numbers and rejects invalid input
  - Preparation time is correctly stored in seconds
  - Meditation time is correctly stored in minutes
  - Min/max clamping works as expected

- **Bell Selection Tests**:
  - Bell dropdowns populate with correct filenames from `assets/bells/`
  - Selected bell values persist in AsyncStorage
  - "None" option is available and functional

- **Predefined Meditations Tests**:
  - All 6+ predefined meditations render and are selectable
  - Only one meditation can be selected at a time
  - Selected meditation's values (prep, duration, bells) are correctly passed to session screen
  - Deselecting a meditation is possible (toggle behavior)

- **Tab Navigation Tests**:
  - Switching between tabs preserves state
  - Begin button is enabled/disabled based on tab and selection state
  - Previous manual time settings are restored when switching back to manual tab

- **Data Persistence Tests**:
  - User's last selections are saved to AsyncStorage
  - Settings are correctly restored on app launch
  - Graceful fallback if AsyncStorage is unavailable

- **UI/Integration Tests**:
  - Begin button correctly navigates to session screen with all selected parameters
  - App responds well on small (320px) and large (430px+) screens
  - No console errors or warnings

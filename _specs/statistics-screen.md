# Spec for statistics-screen

branch: claude/feature/statistics-screen
design_reference: _specs/design-assets/home-page/jhanna-timer/project/Meditation Stats.html

## Summary
Build the visual skeleton for the Statistics screen of the meditation app, matching the provided HTML/React mockup. This iteration focuses **only on the static UI layout and styling** using mock data — no real persistence, no live streak calculation, no chart binding to AsyncStorage. The wiring to Zustand / AsyncStorage and Victory Native will happen in a follow-up spec.

## Functional Requirements

### Screen Header
- Back arrow (chevron-left) in the top-left that navigates back to the Home screen.
- Title "My Statistics" displayed next to the back arrow.

### Stat Cards Row
- Three cards in a horizontal row, equal width, with small gaps between them.
- Each card shows:
  - A small icon at the top (leaf for Current Streak, trophy for Longest Streak, lotus/meditation for Total Sessions).
  - A large numeric value.
  - A two-line label below the value.
- Cards use the Tan/Sand background with Warm Brown text.
- Use mock values for now: Current Streak `14`, Longest Streak `31`, Total Sessions `87`.

### Daily Minutes Chart Section
- Container card with rounded corners, Cream/Card background.
- Header row containing:
  - Title "Daily Minutes" on the left.
  - A range dropdown on the right with options: "Last 7 days", "Last 14 days", "Last 30 days", "Last 3 months".
  - Default selected range: "Last 14 days".
- Bar chart area below the header:
  - Vertical terracotta bars representing daily minutes.
  - The most recent (today) bar uses the Warm Brown color.
  - Zero-minute days render as a thin, low-opacity bar.
  - A dashed Warm Gold horizontal line representing the average across non-zero days, with an `avg Xm` label at the right end.
  - Date labels (`MM DD`) under every other bar.
  - Horizontal scroll allowed if bars overflow the container width.
- Legend row below the chart with three entries:
  - Terracotta swatch — "Session"
  - Warm Gold dash — "Daily avg (X min)"
  - Warm Brown swatch — "Today"
- For the visual skeleton, use the mock data sets from the HTML reference (`ALL_BAR_DATA`) and switch the rendered dataset based on the dropdown selection (local state only, no persistence).

### Past Sessions List
- Section header with title "Past Sessions" on the left and `{count} recent` on the right.
- Vertical list of session rows. Each row contains:
  - A circular Tan/Sand badge with a clock icon.
  - The session type (e.g. "Morning Calm") in bold.
  - A subtitle with `date · time`.
  - A pill on the right showing the duration (e.g. "12 min") on a Cream background.
  - A subtle Tan/Sand left border accent.
- Use the mocked `SESSIONS` array from the HTML reference (10 entries) for the skeleton.
- The list area must be vertically scrollable as part of the overall scrollable screen.

### Layout & Scrolling
- Full screen background uses the Cream color.
- Entire content is vertically scrollable.
- Padding around the content roughly matches the reference (16px horizontal, extra bottom padding so the last card is not flush against the screen edge).

## Design Reference
- File: `_specs/design-assets/home-page/jhanna-timer/project/Meditation Stats.html`
- Key visual constraints:
  - Color palette must match the project palette defined in `CLAUDE.md`:
    - Cream `#F5E6D3` (background)
    - Tan/Sand `#C8A96E` (cards, badges)
    - Warm Gold `#D4B856` (avg line)
    - Terracotta `#E8936A` (chart bars)
    - Warm Brown `#A0654A` (today bar, primary text/icons)
    - Card surface `#EDD9C0` (chart and session row background)
  - Rounded corners: ~16px on cards, ~12px on session rows, ~8px on small pills.
  - Typography hierarchy: bold/heavy weight for numeric values and section titles, lighter weights and reduced opacity for labels.
  - Vertical rhythm matches the reference (≈20px gaps between major sections).

## Possible Edge Cases
- Range dropdown closed/open state — should toggle on tap and close after a selection.
- Long session type names — should not break the row layout (truncate or wrap as needed).
- Zero-minute days in the chart — render as a thin, faded bar (handled visually by the skeleton).
- Horizontal overflow of the bar chart on smaller widths — must scroll horizontally inside its container without affecting the rest of the layout.
- Empty past-sessions list — out of scope for this skeleton; assume the mock array is always populated.

## Acceptance Criteria
- The screen renders on Android (Pixel 8 Pro target) without layout warnings.
- All three stat cards, the chart section, and the past sessions list are visible and styled per the design reference.
- The range dropdown is interactive and updates the rendered chart dataset based on the local component state.
- The screen can be navigated to from the Home screen via the existing stats icon (wire the navigation entry only — no data fetching).
- Tapping the back arrow returns the user to the Home screen.
- No real data sources are wired: streaks, sessions, and chart data all come from in-file mock constants.
- Code follows the project conventions in `CLAUDE.md` (functional components, NativeWind for styling, screen file under `src/screens/`, reusable pieces under `src/components/`).

## Open Questions
- Should the bar chart be rendered with Victory Native already (even on mock data) or with plain `react-native-svg` for the skeleton, deferring the Victory Native swap to the data-wiring spec? response: render it with the victory native 
- Should the icons in the stat cards be emoji (as in the HTML mock) or `@expo/vector-icons` from the start? response: no
- Does the existing Home screen already have a "stats" icon entry point, or should the navigation hookup be added as part of this spec? response: add it.
- Is there a defined navigation stack name for this screen (e.g. `Stats`, `Statistics`, `History`)? response: not thtat I'm aware of

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Renders the screen with all three stat cards, the chart section, and the past sessions list visible.
- Renders the default selected range as "Last 14 days" and updates the chart data when a different range is selected from the dropdown.
- Renders one row per item in the mocked sessions array with the correct type, date/time, and duration text.
- Pressing the back arrow triggers navigation back to the Home screen (mock the navigation prop).

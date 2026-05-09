# Spec for stats-screen-v2

branch: claude/feature/stats-screen-v2
design_reference: _specs/design-assets/Meditation Stats v2.html

## Summary
Redesign of the existing Statistics screen to match the new "Meditation Stats v2" mockup. The dropdown range selector is replaced by a horizontal tab bar (Days / Weeks / Months / All Time), each tab shows a different aggregation of the user's real session data, the chart card gains a contextual header (current period value + average), and the All Time tab introduces a new cumulative area chart. The Past Sessions list and three top stat cards remain, with minor tweaks to row formatting and section header copy.

This spec replaces the existing Daily Minutes chart UI; it builds on top of the persistence layer already shipped in `session-storage-and-stats`.

## Functional Requirements

### Screen Header
- Back arrow (chevron-left) in the top-left that navigates back to Home (unchanged from current screen).
- Title "My Statistics" next to the back arrow (unchanged).

### Stat Cards Row (unchanged)
- Three cards in a horizontal row, equal width: Current Streak, Longest Streak, Total Sessions.
- Values come from the live Zustand store (`streak.current`, `streak.longest`, `sessions.length`).
- Visual styling unchanged from the current implementation.

### Tab Navigation (new)
- Replaces the existing range dropdown.
- Four tabs in a single horizontal row, equal width: **Days**, **Weeks**, **Months**, **All Time**.
- Selected tab is indicated by a 2.5px Warm Brown bottom border, bold weight, and Warm Brown text. Inactive tabs use a muted color and regular weight.
- Tab bar sits directly above the chart card and shares the bottom-border line with it (1.5px Tan/Sand divider running the full width).
- Default selected tab on screen open: **Days**.
- Tab selection is local UI state only — no persistence between visits.

### Chart Card

#### Header
- Section title that depends on the active tab:
  - Days → "Time per Day"
  - Weeks → "Time per Week"
  - Months → "Time per Month"
  - All Time → "All Time"
- Below the title, a single line of context:
  - For Days / Weeks / Months: `{formatted current period value} {period label}`, followed by `Avg: {formatted avg}` in muted text.
    - Period label: `today` / `this week` / `this month`.
    - Current period value = the value of the most recent bucket (today's minutes, this week's total, this month's total).
    - Avg = average of non-zero buckets in the visible range.
  - For All Time: `Total: {formatted total minutes}`.

#### Time formatting
- A shared `formatMins` helper:
  - `< 60` → `"{m} min"`
  - `>= 60` and remainder == 0 → `"{h}h"`
  - `>= 60` and remainder > 0 → `"{h}h {r} m"`

#### Bar chart (Days / Weeks / Months)
- Vertical Terracotta bars; the most recent bucket is rendered in Warm Brown to indicate "current".
- Empty buckets (0 minutes) render as a thin (~3px) bar at low opacity (~0.25).
- Dashed Warm Gold horizontal line at the average of non-zero buckets.
- The label `avg {formatMins(avg)}` is rendered at the right end of the dashed line in Warm Gold, bold.
- X-axis labels under each bar:
  - **Days**: single-letter day-of-week abbreviation in the device's locale (English defaults: S M T W T F S — use the project's existing date helper if present, otherwise hardcode English initials for now).
  - **Weeks**: day-of-month for the week's start date (e.g. `15`, `22`); when the bucket starts a new month, render the month abbreviation instead (`Mar`, `Apr`).
  - **Months**: three-letter month abbreviation (`Jun`, `Jul`, …).
- Bucket counts:
  - Days → last 14 days.
  - Weeks → last 14 weeks (week starts on Monday — match the convention already used by the date utils, otherwise default to Monday).
  - Months → last 12 months.
- Values per bucket = total meditation minutes summed across all sessions whose `date` falls within that bucket.

#### Area chart (All Time)
- Smooth (linear) line + filled area below the line, both in Terracotta with a vertical gradient (top ~50% opacity, bottom ~5% opacity).
- One data point per year-quarter (or evenly spaced cumulative samples — see Open Questions). The most recent point is the current cumulative total.
- X-axis labels appear only on year boundaries (e.g. `2023`, `2024`, `2025`, `2026`); intermediate points have no label.
- No average line, no per-bucket label.

#### Legend
- Below the chart, a single-line legend.
  - Days / Weeks / Months: three entries — Terracotta swatch "Session", Gold dash "Avg ({formatMins(avg)})", Warm Brown swatch "Current".
  - All Time: one entry — Terracotta swatch "Cumulative".

### Past Sessions List
- Section header: "Past Sessions" on the left, `{N} recent` on the right (where `N` is the number of rows actually rendered).
- Vertical list of session rows, sorted newest-first, sourced from the live store.
- Each row shows:
  - Circular Tan/Sand badge on the left containing a clock icon (existing `SessionRow` styling is acceptable — visual tweaks only if needed to match v2).
  - A bold primary line. The v2 mock shows a session "type" (e.g. "Morning Calm"); this app does not track session types, so the primary line should instead show **the formatted date** (e.g. "Apr 26, 2026") in bold.
  - A muted secondary line showing the time of day (e.g. "7:02 AM").
  - A right-side pill with the duration (e.g. `12 min`) on the Cream background.
- Cap the number of rendered rows to the most recent 30 sessions (Open Question).

### Layout & Scrolling
- Cream background.
- Entire content remains vertically scrollable in a single `ScrollView`.
- Outer padding matches the current screen (16px horizontal, ~32px bottom).
- Vertical rhythm between major sections ≈ 20px (matches the reference).

## Design Reference
- File: `_specs/design-assets/Meditation Stats v2.html`
- Colors must match the project palette in `CLAUDE.md`:
  - Cream `#F5E6D3` (background)
  - Tan/Sand `#C8A96E` (stat cards, badges, divider)
  - Warm Gold `#D4B856` (avg line + label)
  - Terracotta `#E8936A` (bars, area chart line + fill)
  - Warm Brown `#A0654A` (current bar, primary text/icons, active tab indicator)
  - Card surface `#EDD9C0` (chart card, session rows)
  - Muted `#B8956A` (axis labels, secondary text, inactive tab)
- Rounded corners: ~16px on the chart card and stat cards, ~12px on session rows, ~8px on duration pills.
- Typography: bold (700–800) for numeric values, section titles, and active tabs; regular and reduced opacity for muted labels.

## Possible Edge Cases
- No sessions stored yet: every bar in Days / Weeks / Months has `mins = 0`; avg label and average line are hidden; the chart header shows `0 min today`/`0 min this week`/`0 min this month` and `Avg: 0 min`. The All Time area chart degrades gracefully to a flat baseline. The Past Sessions list shows the section header with `0 recent` and no rows.
- A single non-zero day in the visible range: avg equals that day's value; dashed line renders at the top of the only non-zero bar.
- The user has more than the cap of recent sessions to render in the list: only the most recent N rows render; the count in the section header reflects what's rendered, not the total (the Total Sessions stat card already shows the all-time count).
- Long bar count (Months tab on a brand-new device): empty months still render as thin faded bars so the time axis is continuous.
- Rapid tab switching: state is local only, no async loading; switching is instant.
- Session occurred at an ambiguous boundary (23:59 vs 00:01): the existing date helpers already normalize to local-day; the chart aggregation must use the same helper.
- Device locale changes day-of-week labels: acceptable to ship English-only initials in this iteration if the existing utils don't expose a localized helper (track in Open Questions).

## Acceptance Criteria
- The Statistics screen renders four tabs (Days / Weeks / Months / All Time) above the chart card; the dropdown is removed.
- Default tab on entry is Days; selecting another tab updates the chart and the chart header in place without reloading the screen.
- Days tab shows a 14-bar chart of real per-day minutes for the last 14 days, with today rendered in Warm Brown.
- Weeks tab shows 14 bars of real per-week totals; Months tab shows 12 bars of real per-month totals.
- All Time tab shows the cumulative area chart with year markers on the x-axis and `Total: {formatted total}` in the chart header.
- Average dashed line + `avg X` label render correctly on the bar tabs and are hidden on the All Time tab.
- Legend updates per tab as specified.
- Past Sessions list reads from the store, sorts newest-first, caps at the configured limit, and shows date / time-of-day / duration pill.
- Stat cards continue to show live values from the store.
- Tapping the back arrow returns to Home.
- No mocked data remains; all values flow from `useAppStore` and the aggregation utilities.
- Code follows project conventions: functional components, NativeWind styling, screen file under `src/screens/`, reusable pieces under `src/components/`, pure aggregators under `src/utils/`.

## Open Questions
- Should the bar chart and area chart be rendered with Victory Native (consistent with the existing `DailyMinutesChart`) or with `react-native-svg` directly (closer to the mock and easier to style for the v2 look)? response: select whatever you think fit best to this, decision, take the effortless path if there funtionality is not lost.
- Week boundary: Monday-start or Sunday-start? The project already has a date helper — should it be extended, or do we just inline the choice here? response: monday start is ok.
- For the All Time area chart, what bucket granularity is appropriate when the user has only a few weeks of history (e.g. brand-new install)? Should the chart be hidden / replaced with a placeholder if total sessions < N? response: maybe the bucket granularity grows as user adds meditations.
- Should the Past Sessions list cap (proposed 30) be configurable, paginate, or render all sessions virtualized via `FlatList`? response: cap up to the last 10 sessions.
- The v2 mock displays a per-session "type" label (e.g. "Morning Calm"). The data model does not track this — do we want to add session types in a follow-up, or permanently drop the field from the row layout? response: drop the field.
- Should the day-of-week initials be localized, or is English-only acceptable for v1 of v2? response: english-only acceptable.

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `formatMins` helper: returns `"45 min"`, `"1h"`, `"2h 30 m"` for 45 / 60 / 150 minutes respectively.
- Weekly aggregation utility: groups sessions into the correct week buckets for a known set of fixture sessions and respects the configured week-start day.
- Monthly aggregation utility: groups sessions into the correct calendar month buckets.
- Cumulative aggregation utility: produces a monotonically non-decreasing series whose final value equals the sum of all stored session minutes.
- Stats screen renders four tabs and defaults to Days.
- Switching tabs swaps the chart and chart-header text without unmounting the screen (snapshot or text query).
- Past Sessions list renders rows for each (capped) session in newest-first order and shows the duration pill.
- Tapping the back arrow calls `navigation.goBack`.

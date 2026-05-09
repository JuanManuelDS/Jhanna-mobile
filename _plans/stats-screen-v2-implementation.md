# Stats Screen v2 Implementation Plan

## Decisions on open questions (locked from spec)
- **Chart rendering:** raw `react-native-svg` (already a dep). The v2 mock is already pure SVG, the look is hard to reproduce in Victory Native, and we drop a transitive Skia dependency from this screen. Effortless path with no functional loss.
- **Week start:** Monday.
- **Past Sessions cap:** 10.
- **Per-session "type" field:** dropped from row.
- **Day initials:** English-only (S M T W T F S).
- **All Time granularity:** ~12 evenly-spaced cumulative samples between the first session and today; granularity grows with history. Still rendered for new users (flat baseline) per the edge cases.

## File-level changes

### New / extended utils — `src/utils/chartData.js`
Replace `getBarChartData` (kept temporarily for the existing test) with a small set of pure aggregators, all driven by an `anchorISO` (today's local date) so they're trivially testable:

- `formatMins(m)` — `<60 → "{m} min"`, `==Nh → "{h}h"`, else `"{h}h {r} m"`.
- `getDailyBuckets(sessions, anchorISO, count=14)` → `[{ key: ISO, label: 'M', mins }]` with English single-letter initials.
- `getWeeklyBuckets(sessions, anchorISO, count=14)` → buckets keyed by Monday-of-week ISO. Label = day-of-month, but the **first bucket of a new calendar month** uses the 3-letter month abbreviation (`Mar`, `Apr`).
- `getMonthlyBuckets(sessions, anchorISO, count=12)` → 3-letter month label (`Jun`, `Jul`, …).
- `getCumulativeSeries(sessions, anchorISO, samples=12)` → `[{ x, cumulative, label }]`, where `label` is a 4-digit year only on year-boundary samples and `''` elsewhere. Empty input yields a single `[0, 0]` baseline.
- Internal helpers: `addDays`, `mondayOf(iso)`, `monthKey(iso)` — small and local; don't expand `utils/date.js` unless reused elsewhere.

The shared `calcChartVars(data)` stays (it's already correct).

### Replace component — `src/components/BarChart.js` (new)
Pure RN-SVG implementation modeled on the v2 mock (`viewBox="0 0 300 148"`, bars + dashed avg + per-bar text). Props: `data`, `currentColor` (Warm Brown for the most recent bar). Renders:
- 0-value bars as 3px tall, opacity 0.25.
- Dashed Warm Gold avg line (hidden when avg is 0).
- `avg {formatMins(avg)}` Gold bold label at the right end of the dashed line.
- X-axis labels under each bar in muted color.

### New component — `src/components/AreaChart.js` (new)
RN-SVG: `LinearGradient` (`#E8936A` 0.5 → 0.05), single `Path` for fill, second `Path` for the line stroke, year labels rendered only where `label !== ''`.

### New component — `src/components/StatsTabs.js` (new)
Four equal-width `Pressable`s in a row, sharing the 1.5px Tan/Sand bottom border with the chart card. Active = 2.5px Warm Brown bottom border + bold Warm Brown text. Local state lives in the screen.

### New component — `src/components/ChartLegend.js` (new)
Tiny presentational. Takes `mode: 'bar' | 'area'` and `avg`. Bar mode: Session / Avg(formatMins) / Current. Area mode: Cumulative.

### Updated SessionRow — `src/components/SessionRow.js`
The current row already shows bold date + muted time + duration pill. Two small tweaks to match v2:
- Drop the `borderLeftWidth: 3.5` accent (not in v2 mock).
- Confirm the secondary line is a single muted line with the time only (currently correct).

### Screen rewrite — `src/screens/StatsScreen.js`
- Local state: `const [tab, setTab] = useState('days')`.
- Compute once: `dailyBuckets`, `weeklyBuckets`, `monthlyBuckets`, `cumulativeSeries`, `totalAllTimeMins` from `useAppStore.sessions`. Memoize with `useMemo`.
- Render: header → stat cards (unchanged) → `StatsTabs` → chart card (title + contextual line + chart + legend) → past sessions list (capped to 10, `{N} recent`).
- Drop the dropdown, drop the `DailyMinutesChart` import.

### Deletions
- `src/components/RangeDropdown.js` — dropdown removed.
- `src/components/DailyMinutesChart.js` — replaced by `BarChart`.
- `src/utils/statsMockData.js` — only used by `RangeDropdown` and stale mocks; safe to remove.

## Tests — `tests/`
Per the spec's testing guidelines, all in `tests/`:

- **`tests/chartData.test.js` (extend)**
  - `formatMins`: 45 → `"45 min"`, 60 → `"1h"`, 150 → `"2h 30 m"`.
  - `getWeeklyBuckets`: fixture sessions across week boundaries land in correct Monday-anchored weeks.
  - `getMonthlyBuckets`: sessions in March/April/May land in correct month buckets, count=12.
  - `getCumulativeSeries`: monotonic non-decreasing; final value === sum of all session durations.
  - Keep / adapt the existing `getBarChartData` tests to call `getDailyBuckets`.
- **`tests/StatsScreen.test.js` (rewrite)**
  - Renders four tabs, defaults to Days.
  - Switching to Weeks / Months / All Time updates the chart-header text (`Time per Week`, `Time per Month`, `Total: ...`) without unmounting.
  - Past Sessions list renders one row per (capped) session, newest-first, with duration pill text matching `^\d+ min$`.
  - Tapping Back calls `navigation.goBack`.
  - Drop the Skia and victory-native mocks — no longer used by this screen. Keep the `react-native-safe-area-context` mock and the `useAppStore` mock.

## Implementation order
1. Add new aggregators + `formatMins` to `chartData.js`; write/update unit tests; run `npm test` for that file alone.
2. Build `BarChart` and `AreaChart` against fixture data; verify rendering by hand.
3. Build `StatsTabs` and `ChartLegend`.
4. Rewrite `StatsScreen.js` wiring real store data through the aggregators.
5. Tweak `SessionRow.js`.
6. Update `tests/StatsScreen.test.js`; run full suite.
7. Delete `RangeDropdown.js`, `DailyMinutesChart.js`, `statsMockData.js`; run `npm test` again to catch dangling imports.
8. Smoke-test on device/Expo with empty store, single session, and a multi-month seeded store.

## Risks / things to watch
- **Empty store on All Time:** the cumulative series must still produce a renderable path (single point breaks the SVG line — emit at least 2 points, both at 0).
- **Week-start boundary off-by-one:** local-time vs UTC drift. Reuse the `T00:00:00` parsing pattern already in `chartData.js` to stay in local time.
- **Most-recent bar coloring on Weeks/Months when the current period has 0 minutes:** still color the last bucket Warm Brown, but with the same low-opacity treatment (3px / 0.25). Confirm visually.
- **`SessionRow` duration string** is compared in tests as `^\d+ min$` — ensure the new design keeps a plain `"{n} min"` (no formatMins on the pill, since spec only uses formatMins in chart text).

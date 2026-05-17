# Spec for meditation-stats-v3

branch: claude/feature/meditation-stats-v3
design_reference: _specs/design-assets/Meditation-stast-v3.html

## Summary
A **UI-only** redesign of the Statistics screen, on top of the data + tab behavior already shipped under `stats-screen-v2.md`. Functional behavior is unchanged: same Days / Weeks / Months / All Time tabs, same live aggregation from the Zustand store, same Past Sessions list, same back-to-home navigation, same `formatMins` helper. What changes is the **visual language** end-to-end:

- New typography: **DM Sans** for UI and **DM Serif Display** for all display numerals and the screen title.
- Screen title copy changes from "My Statistics" to **"Your Practice"**.
- All surface cards adopt a **soft glass treatment** — fill `rgba(255, 248, 240, 0.8)` with a 1px Tan/Sand border at 25% opacity — replacing the solid Tan/Sand and solid Card-surface fills used in v2.
- The three-equal-cards row becomes a **hero streak card** + a **row of two smaller cards** (Longest + Total). Current Streak is the hero.
- The hero card has three columns: a flame badge, a serif streak number with caption + best-ever subtitle, and a mini 7-dot "this week" indicator on the right.
- The tab bar **moves inside the chart card** (rather than sitting above it on a shared divider) and changes its active treatment to a Terracotta underline.
- The chart card header swaps the v2 layout for a small uppercase tracked label + a large serif current-value with a period suffix. The `Avg:` chip and the legend are removed.
- Bars become pill-shaped with a uniform softer opacity; the most recent bar remains Warm Brown at full opacity.
- The area chart gains a smooth cubic-bezier curve and a small end-of-line dot.
- Past Sessions becomes "Recent Sessions" inside a dedicated glass card. The duration pill is removed (plain right-aligned text), and the row badge becomes a rounded-square Terracotta-tinted icon container.

No data model, store, or navigation change. The existing aggregators from the v2 work are reused as-is.

## Functional Requirements

### Fonts (new)
- Load **DM Sans** (weights 300, 400, 500, 600, 700) and **DM Serif Display** (regular + italic) via `expo-google-fonts/dm-sans` and `expo-google-fonts/dm-serif-display`, with a splash gate (`useFonts` + `expo-splash-screen.preventAutoHideAsync`) so text renders correctly on first paint.
- DM Sans is the screen's default body font; DM Serif Display is used only for:
  - the screen title "Your Practice"
  - the hero streak numeral
  - the secondary stat card numerals (Longest, Total)
  - the chart card's current-value numeral

### Screen Header
- Outer container padding: `0 20px 32px`. The header has its own top padding of 40px to clear the status bar (matches the mock).
- Left: **38×38 rounded-square button**, background `rgba(160, 101, 74, 0.1)` (Warm Brown @ 10%), border-radius 12px, no border. Contains an arrow-with-tails back icon stroked in Warm Brown, 18×18, stroke-width 2. Tapping it calls `navigation.goBack()`.
- 12px horizontal gap to the title.
- Title: **"Your Practice"** in DM Serif Display, 22px, Warm Brown `#A0654A`, letter-spacing -0.3.

### Hero Streak Card (new)
- Glass surface: fill `rgba(255, 248, 240, 0.8)`, 1px border `rgba(200, 169, 110, 0.25)`, border-radius 20px, padding `20px 20px 16px`.
- Three columns in a single row, vertically centered, 16px gap:
  - **Left — Flame badge** (60×60 circle, `flex-shrink: 0`)
    - Background: radial gradient from `rgba(232, 147, 106, 0.2)` at ~40%/40% origin → `rgba(212, 184, 86, 0.1)` at 70% → transparent.
    - 1px border `rgba(232, 147, 106, 0.2)`.
    - Contents: a two-tone flame icon (outer flame Terracotta @ 90% opacity, inner flame Warm Gold @ 85% opacity), 28×28.
  - **Middle — Streak block** (`flex: 1, min-width: 0`)
    - Top line, baseline-aligned, 6px gap:
      - Streak number: `streak.current`, DM Serif Display, 38px, Warm Brown `#A0654A`, line-height 1, letter-spacing -1.
      - Caption: `"day streak"`, DM Sans 13px regular, Tan/Sand `#C8A96E`.
    - Second line (4px top margin):
      - `"Best: {streak.longest} days"`, DM Sans 11px regular, Tan/Sand `#C8A96E`, letter-spacing 0.2.
  - **Right — "This week" mini indicator** (`flex-shrink: 0`)
    - 7 small dots in a horizontal row, 2.5px gap, each 4×4 with 2px border-radius.
    - Each dot represents one of the last 7 calendar days (today is the right-most dot).
    - **Active days** (a session was completed/partial on that day) are rendered in Terracotta `#E8936A`, with opacity ramping `0.4 + i * 0.09` where `i` is the dot's index in the row (0 = leftmost / oldest day). This produces a calm "fading-in" gradient toward today.
    - **Inactive days** render in `rgba(200, 169, 110, 0.25)` at opacity 1.
    - 3px gap below the dot row, then a small all-caps label: `"THIS WEEK"`, DM Sans 8px, Tan/Sand `#C8A96E`, letter-spacing 0.5.

### Secondary Stat Row (Longest + Total)
- Two-column grid below the hero, 10px gap, 10px top margin.
- Each card: glass surface (same recipe), border-radius 16px, padding `14px 16px`, horizontal flex with 10px gap, items centered.
- **Longest Streak card** — Trophy outline icon (18×18, stroke Tan/Sand `#C8A96E`, stroke-width 1.8, rounded caps/joins) + value `streak.longest` in DM Serif Display 22px Warm Brown (line-height 1) above the label "Longest streak" in DM Sans 10px regular, Tan/Sand, letter-spacing 0.3, 2px top margin.
- **Total Sessions card** — Clock outline icon (18×18, same stroke recipe) + value `sessions.length` in DM Serif Display 22px Warm Brown above the label "Total sessions" with the same typography.

### Chart Card
- Glass surface (same recipe), border-radius 20px, 16px top margin, `overflow: hidden` so the tab underline clips correctly.
- **Tabs sit inside the card**, inset by 16px horizontal padding. There is no longer a separate tab strip above the card.

#### Tab Navigation
- Four equal-width tabs in a flex row: **Days**, **Weeks**, **Months**, **All Time**.
- Bottom border on the strip: 1px `rgba(200, 169, 110, 0.18)`.
- Each tab button:
  - Padding `11px 4px 9px`, transparent background, no left/right/top border.
  - Bottom border: active → 2px Terracotta `#E8936A`; inactive → 2px transparent.
  - Font: DM Sans 12px, letter-spacing 0.4. Active weight 500, inactive weight 400.
  - Color: active → Warm Brown `#A0654A`; inactive → `rgba(160, 101, 74, 0.4)`.
  - `margin-bottom: -1` so the active underline overlaps the strip divider.
  - 0.2s ease transition on color + border.
- Default tab on screen open: **Days**. State is local UI only, not persisted (unchanged from v2).

#### Chart Body
- Padding `14px 14px 12px`.
- **Header** (10px bottom margin):
  - Small uppercase tracked label: depends on tab — `"TIME PER DAY"`, `"TIME PER WEEK"`, `"TIME PER MONTH"`, `"ALL TIME"`. DM Sans 10px, weight 500, Tan/Sand `#C8A96E`, letter-spacing 0.8, `text-transform: uppercase`, 4px bottom margin.
  - Value row, baseline-aligned:
    - Days / Weeks / Months: serif current value (`formatMins(currentBucket)`) in DM Serif Display 24px Warm Brown line-height 1, **8px gap**, then DM Sans 11px Tan/Sand suffix — `"today"` / `"this week"` / `"this month"`.
    - All Time: serif total (`formatMins(totalAllTime)`) in DM Serif Display 24px Warm Brown, **6px gap**, then DM Sans 11px Tan/Sand suffix `"total"`.
  - The standalone `Avg: …` text from v2 is **removed**. Average is only conveyed by the dashed line in the chart itself.

#### Bar Chart (Days / Weeks / Months)
- SVG viewBox `0 0 300 142` (`CHART_H = 120` + 22px label band), `width: 100%`, `preserveAspectRatio: xMidYMid meet`.
- Layout: `n` bars with 6px gap between them; bar width = `(300 - 6 * (n − 1)) / n`.
- Bar geometry: `rx = barW / 2.5` (pill-shaped tops/bottoms). Height proportional to `mins / max(mins, 1)`.
- Bar fill:
  - Most recent (last) bar → Warm Brown `#A0654A` at opacity 1.
  - All other non-zero bars → Terracotta `#E8936A` at opacity 0.7 (uniform — no per-bar variation).
  - Zero-value buckets → 2px tall, opacity 0.15.
- Dashed average line: horizontal across the full width at `y = CHART_H − (avg / maxMins) * CHART_H`, stroke Warm Gold `#D4B856`, stroke-width 0.8, dash-array `3 3`, opacity 0.6.
- Right-anchored label `"avg {formatMins(avg)}"` at `y = avgY − 4`, DM Sans 7px weight 500 in Warm Gold at opacity 0.8.
- X-axis labels per bucket: DM Sans 7px Tan/Sand, centered under each bar. Label content per tab follows v2 (single-letter day-of-week / day-of-month or month abbrev / 3-letter month).
- Bucket counts unchanged from v2: Days = 14, Weeks = 14, Months = 12.

#### Area Chart (All Time)
- SVG viewBox `0 0 300 150` (`AREA_H = 130` + 20px label band).
- **Smooth curve** — cubic bezier between points, with control points at 40% / 60% of each segment's horizontal distance (per the mock):
  - For each segment, `cp1 = (prev.x + 0.4 * dx, prev.y)` and `cp2 = (prev.x + 0.6 * dx, curr.y)`.
- Area fill: vertical linear gradient Terracotta `#E8936A` — 0.35 opacity at top → 0.02 at bottom.
- Line: Terracotta stroke, stroke-width 1.8, opacity 0.7, no fill.
- **End-of-line dot**: 3px radius Terracotta circle at the latest data point.
- X-axis labels only on year boundaries (`"2023"`, `"2024"`, …), DM Sans 7.5px Tan/Sand, centered.
- No average line. No per-point label otherwise.

#### Legend
- **Removed.** The v2 legend (Session / Avg / Current swatches) does not appear in v3.

### Recent Sessions Card
- Section relocates inside its own glass card (same recipe), border-radius 20px, 16px top margin, padding `4px 16px`.
- **Section header** row (padding `14px 0 4px`):
  - Left label: `"RECENT SESSIONS"`, DM Sans 10px weight 500, Tan/Sand, uppercase, letter-spacing 0.8.
  - Right meta: `"{N} sessions"`, DM Sans 11px regular, Tan/Sand.
- Rows render directly on the card surface — there is **no** per-row colored background.
- Each row: `padding: 12px 0`, horizontal flex with 12px gap, vertically centered.
- Each non-last row carries a 1px bottom divider in `rgba(200, 169, 110, 0.12)`. The last row has no divider.
- **Row badge** (left): 36×36 rounded-square, border-radius 12px, background `rgba(232, 147, 106, 0.1)`, 1px border `rgba(232, 147, 106, 0.12)`. Contains a 15×15 clock icon stroked in Terracotta at opacity 0.7 (stroke-width 1.5, rounded caps/joins).
- **Row text block** (middle, `flex: 1, min-width: 0`):
  - Primary line: the **formatted date** (e.g. "Apr 26"), DM Sans 13px weight 500, Warm Brown, 1px bottom margin. (The mock shows a session type label, but the data model has no session types. We render the date as the primary line — same compromise as v2.)
  - Secondary line: `"{secondaryDate} · {timeOfDay}"`, DM Sans 11px regular, Tan/Sand. Use a longer-form date here (e.g. "Apr 26, 2026") so the row still carries the year when scrolled back in history — the primary line stays short for visual rhythm.
- **Row duration** (right): plain text — no pill. `"{N} min"`, DM Sans 13px weight 500, Warm Brown, letter-spacing -0.2, `flex-shrink: 0`.
- Cap: most recent **10** sessions (carried over from v2).

### Layout & Scrolling
- Cream `#F5E6D3` page background.
- Single vertical `ScrollView` containing in order: header → hero streak card → secondary stat row → chart card (with tabs inside) → recent sessions card.
- Outer container padding `0 20px 32px` (horizontal 20px each side; bottom 32px).
- Vertical rhythm between major blocks: hero → small-cards row = 10px; small cards → chart card = 16px; chart card → sessions card = 16px.

## Design Reference
- File: `_specs/design-assets/Meditation-stast-v3.html` (the rendered design is also extractable from the Anthropic design bundle; the standalone JSX lives at `jhanna-timer/project/standalone/Meditation Stats v3.html` inside that bundle).
- Project palette (per `CLAUDE.md`):
  - Cream `#F5E6D3` — page background
  - Tan/Sand `#C8A96E` — used as the **muted text color** in v3 (all labels, captions, suffixes, axis labels), and as the source color for the 25% card border
  - Warm Gold `#D4B856` — average dashed line + label
  - Terracotta `#E8936A` — bars, area chart line + fill, flame outer, row badge tint, active tab underline
  - Muted Coral `#D4796A` — unused in this iteration
  - Warm Brown `#A0654A` — primary text token, hero numeral, active tab text, "current" bar, back button tint
- Glass surface recipe: fill `rgba(255, 248, 240, 0.8)`, 1px border `rgba(200, 169, 110, 0.25)`. No backdrop blur is used — flat semi-transparent fill only.
- Corner radii: 20px hero / chart / sessions cards; 16px secondary stat cards; 12px back button; 12px row badge; 2px mini-week dots.
- Typography: **DM Serif Display** for the title and every prominent numeral; **DM Sans** elsewhere with weights 400 / 500 in active use.

## Possible Edge Cases
- **No sessions yet**: hero shows `0` with caption "day streak" and "Best: 0 days"; mini-week strip shows seven inactive dots; both secondary cards show `0`; chart header value reads `0 min today` / `0 min this week` / `0 min this month` / `0 min total` per tab; bar chart renders 14 / 14 / 12 empty thin bars (opacity 0.15) with no average line (since `nonZero.length === 0`); area chart degrades to a flat baseline; sessions card shows the header with `"0 sessions"` and no rows.
- **Mini-week strip vs streak**: a day on the strip is "active" iff a session exists for that calendar day, **not** if it contributes to the current streak. So a non-streak active day (e.g. a one-off after a gap) still lights its dot.
- **Streak across DST or timezone change**: use the existing date helper (same one the streak logic uses) to decide both the strip's active days and the streak count, so they never disagree.
- **Very large streak numbers** (3+ digits): DM Serif Display 38px must not push the mini-week strip off the right of the hero. If `streak.current >= 1000`, allow the numeral to shrink one step (e.g. 32px) rather than wrapping.
- **Glass + dark device wallpaper**: not applicable — this app draws its own Cream background under every screen.
- **Font load failure / first-paint**: while fonts are loading the splash screen stays up (handled by `expo-splash-screen.preventAutoHideAsync`). If load fails, fall back to system serif / sans without crashing the screen.
- **Long-tail Past Sessions** (> 10 items): only the 10 newest render in this card; the all-time count lives in the Total Sessions stat card.
- **Locale**: day-of-week initials in the bar chart remain English-only (decision carried from v2).

## Acceptance Criteria
- The Statistics screen renders, in order: header, hero streak card, two-card stat row (Longest + Total), chart card (with tab nav inside it), Recent Sessions card.
- Screen title reads "Your Practice" in DM Serif Display.
- Hero card shows the live `streak.current` as a serif numeral, the caption "day streak", the `Best: {streak.longest} days` subtitle, and a 7-dot mini-week strip whose active dots correspond to days in the last 7 calendar days on which the user has at least one session.
- Both secondary cards display live values (`streak.longest`, `sessions.length`) in DM Serif Display with their outline icons.
- Tab nav sits inside the chart card; default tab is Days; switching tabs updates the chart card's uppercase label, serif current-value, and chart body in place.
- Bar chart: bars are pill-shaped, non-current bars are Terracotta at uniform 0.7 opacity, the most recent bar is Warm Brown at full opacity, zero buckets render at 2px / 0.15 opacity, average dashed line + right-aligned `avg X` label render in Warm Gold.
- Area chart (All Time): smooth cubic-bezier curve, vertical Terracotta gradient fill (0.35 → 0.02), 3px end-of-line dot, year-boundary x-axis labels only, no average line.
- No legend renders on any tab.
- Recent Sessions card uses the glass surface, header reads "RECENT SESSIONS" and `"{N} sessions"`, rows have no per-row background, are separated by hairline dividers, last row has no divider; the duration is plain text (no pill); the row badge is a rounded-square Terracotta-tinted container.
- Back button is a 38×38 rounded-square Warm-Brown-tinted button containing the arrow-with-tails icon; pressing it calls `navigation.goBack()`.
- All numbers come from `useAppStore` / the existing aggregation utilities — no mocked data remains in the screen.
- DM Sans and DM Serif Display are loaded via `expo-google-fonts` before the screen paints text.
- Code follows project conventions: functional components, NativeWind where it can express the style (with inline `style={{}}` escape for `rgba()` opacities, gradients, and explicit font-family — NativeWind classes alone can't express the radial gradient or custom letter-spacing values used here), screen in `src/screens/`, reusable parts (`StreakHero`, `SecondaryStats`, `TabNav`, `BarChart`, `AreaChart`, `SessionRow`) in `src/components/`.

## Open Questions
- The mock keeps a session "type" label as the primary row text (e.g. "Morning Calm"). Our data model has no types — we'll use the formatted date as the primary line and put `{date} · {time}` on the secondary line. Confirm? *(Default answer from v2: drop the type field. Carrying it forward.)* - response: default assumption is great.
- The mini "THIS WEEK" strip: should it be **strict** (only Mon→Sun of the current ISO week, with empty slots for future days) or **rolling** (the last 7 calendar days including today)? The mock isn't explicit either way. Default proposal: **rolling last 7 days**, since it matches how the rest of the screen reads time and it always shows 7 filled dots' worth of context. - response: last 7 days up to today, not including it.
- Should the mini-week strip render today's dot at full saturation regardless of opacity ramp, to mirror the bar chart's "current" treatment? Default proposal: yes, today is always opacity 1 if active. response: great default assumption
- Fonts: add `@expo-google-fonts/dm-sans` and `@expo-google-fonts/dm-serif-display` to dependencies, or self-host the `.ttf` files under `src/assets/fonts/`? Default proposal: use the expo-google-fonts packages — simpler and matches how other Expo projects handle Google Fonts. - response: yes, go with the easiest solution.
- The v3 chart card uses `overflow: hidden` so the tab underline clips inside the rounded card. In React Native this can have a perf cost on Android. If we hit issues, is it acceptable to drop `overflow: hidden` and let the underline render flush with the card edge instead? Default proposal: yes — purely visual. - response: great default proposal.
- The hero's `Best: X days` subtitle duplicates the Longest Streak card below. Keep both (the mock does), or drop one? Default proposal: keep both — the hero subtitle is for at-a-glance context, the card is the canonical stat. - response: the 'Best: X days' card is for the longest historical streak, the other is for the actual one.

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- The Statistics screen renders the header (with "Your Practice" title), hero streak card, two-card stat row, chart card containing the tab nav, and Recent Sessions card, in that order.
- Hero card: with a seeded store of `{ streak.current: 14, streak.longest: 31 }`, the streak numeral reads `14`, the caption reads `day streak`, and the subtitle reads `Best: 31 days`.
- Mini-week strip: given a fixture of sessions across the last 7 days, the active-dot indices correspond to days that have sessions; days without sessions render the inactive style.
- Secondary cards: with a seeded store, Longest = `streak.longest` and Total = `sessions.length`.
- Default tab is `Days`; switching to `Weeks` updates the uppercase label to `TIME PER WEEK` and the suffix to `this week`; switching to `All Time` swaps the body to the area chart and shows the `total` suffix.
- Average dashed line is hidden when all visible buckets are zero (no non-zero data).
- Recent Sessions: with > 10 sessions in the store, only 10 rows render, sorted newest-first; the header reads `10 sessions`; the last row has no bottom divider; the duration is plain text (no pill background).
- Back button press calls `navigation.goBack`.
- Regression: the v2 aggregators (daily / weekly / monthly / cumulative) and `formatMins` continue to pass their existing tests unchanged.

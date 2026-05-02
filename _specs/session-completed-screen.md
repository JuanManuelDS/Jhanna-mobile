model# Spec for session-completed-screen

branch: claude/feature/session-completed-screen
design reference: _specs/design-assets/home-page/jhanna-timer/project/session-finished-page.html

## Summary
Build the **Session Complete** screen of the Jhanna meditation app — the third of the four screens defined in CLAUDE.md. This screen is shown immediately after a meditation session finishes (whether by natural completion or early stop) and is the user's "soft landing" before they return to the Home screen or jump into Statistics.

The screen is mostly presentational: it renders a centered card summarising the session that just ended (lotus icon, "Session Complete" title, duration, date, and current streak) plus two action buttons ("Return Home" and "View Statistics"). The data shown is passed in via navigation params from the Session screen — this screen does not recompute streaks or write to AsyncStorage; persistence already happened upstream.

The visuals must match the reference design: a tan/sand card on a cream background, lotus glyph in terracotta, warm-brown typography, and stacked terracotta + outlined buttons at the bottom.

## Functional Requirements

### Screen-level
- Create `src/screens/CompleteScreen.js` as a functional React Native component.
- Register it in the navigation stack as the `Complete` route, reachable from the Session screen.
- Background fills the screen with Cream `#F5E6D3`.
- Vertical layout: status area at top (handled by SafeAreaView / system), centered content region in the middle, and a buttons block directly under the card. The card and buttons sit together in the vertical center of the screen, not pinned to the bottom.

### Navigation params (input)
The Session screen navigates here with the following params:
- `duration` (number, in minutes) — the actual meditated time to display (already adjusted for early stop per the session-screen spec).
- `streakCount` (number) — the current streak value after this session, as recomputed by the Session screen.
- `date` (ISO date string or `Date`) — the date of the completed session. If omitted, fall back to `new Date()` at render time.

The screen must render correctly using only these params; it must **not** read AsyncStorage on mount.

### Card (centered)
- Width: full width minus ~24px horizontal padding.
- Background: Tan/Sand `#C8A96E`, rounded ~24px corners, soft warm drop shadow.
- Internal padding ~32px top, ~28px sides, ~28px bottom.
- Vertical stack, centered horizontally:
  1. **Lotus icon** at the top — terracotta `#E8936A`, ~68px. Use a custom SVG (matching the reference design) or an equivalent vector icon. The lotus has overlapping petals at varying opacities and a small cream-tinted center circle.
  2. **Title** "Session Complete" — DM Serif Display (or system serif fallback), ~28px, regular weight, warm brown `#A0654A`, centered, with ~24px margin below.
  3. **Stats list** — three rows separated by faint warm-brown horizontal dividers (top, between each row, and bottom). Each row is a flex row with the label on the left and the value on the right:
     - "DURATION" → `${duration} min`
     - "DATE" → e.g. `Sunday, April 26` (formatted with `toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })`)
     - "STREAK" → `${streakCount} consecutive days`
     - Labels: ~13px, medium weight, warm brown at ~70% opacity, uppercase, ~6% letter-spacing.
     - Values: ~15px, semi-bold, warm brown `#6B4A35` (slightly darker brown used in the design for value text).
     - Each row has ~12px vertical padding.
     - Dividers: 1px tall, warm brown at ~18% opacity.

### Buttons (below the card)
Stacked vertically with ~12px gap, full width matching the card.
- **Return Home** (primary, filled):
  - Terracotta `#E8936A` background, no border, rounded ~16px, height ~54px.
  - Label "Return Home" in cream/off-white, semi-bold, ~16px.
  - On press: navigate back to the Home screen (resetting the nav stack so the Session and Complete screens are not in history).
  - Pressed state: slightly darker terracotta tint and a subtle scale-down (~0.98).
- **View Statistics** (secondary, outlined):
  - Transparent background, 1.5px warm-brown `#A0654A` border, rounded ~16px, height ~54px.
  - Label "View Statistics" in warm brown `#A0654A`, semi-bold, ~16px.
  - On press: navigate to the Statistics screen.
  - Pressed state: faint warm-brown background tint (~7% opacity) and the same scale-down.

### Visual / styling
- Use NativeWind classes for styling per project rules; reach for `StyleSheet.create` only where NativeWind cannot express something (custom shadows, SVG props).
- Use the project color palette exactly. Two off-palette tones from the reference are acceptable supporting values: `#FDF4EC` for filled-button text and `#6B4A35` for stat values — both already used in the home/session designs.
- Typography uses DM Sans for labels and buttons and DM Serif Display for the title (same fonts already wired up by the home-screen spec).
- The screen feels calm and finished — no extra ornamentation beyond what the reference shows.

## Design Reference
- Source HTML/JSX: `_specs/design-assets/home-page/jhanna-timer/project/session-finished-page.html` (canonical reference for exact spacing, colors, and the lotus SVG path data).
- Color palette is defined in `.claude/CLAUDE.md` and must be respected.
- Layout: card vertically centered (with the buttons block) inside the available content area, ~24px horizontal padding, ~20px gap between the card and the buttons block.
- Lotus SVG: five overlapping petals at varying opacities (center = 0.9, sides = 0.65, far sides = 0.4), a curved stem/base stroke, and a center cream circle — see lines 87–102 of the reference HTML for the exact path data.

## Possible Edge Cases
- **Missing or zero `streakCount`**: render `1 consecutive days` rather than crashing or hiding the row.
- **Missing `duration`**: fall back to `0 min`. The Session screen is expected to always pass it; this is defensive only.
- **Missing `date` param**: fall back to `new Date()` at render time so the row always has a value.
- **Singular vs plural for streak**: keep the simple "N consecutive days" string for all values including 1 — matches the reference and avoids extra logic.
- **Hardware back button (Android)**: treat as "Return Home" — reset the stack to Home rather than going back to the Session screen, which has already exited.
- **Long localized date strings**: the date row may wrap on small screens; allow it to wrap onto two lines rather than truncating.
- **Re-entering the screen**: if the user backgrounds the app on this screen and returns, it should still show the same data (the params are part of the route, not transient state).

## Acceptance Criteria
- Finishing a Meditation phase from the Session screen lands on the Complete screen with the correct duration, today's date, and the updated streak from CLAUDE.md's streak rules.
- Tapping "Return Home" returns to the Home screen and resets the nav stack so back navigation does not return to the Complete or Session screens.
- Tapping "View Statistics" navigates to the Statistics screen.
- Card visuals match the reference: tan/sand background, lotus icon at top in terracotta, "Session Complete" title in serif warm brown, three stat rows separated by faint dividers.
- Buttons render stacked, full-width, with the filled terracotta primary on top and the outlined warm-brown secondary below.
- Background is cream; no other content (no header, no streak badge, no nav chrome on this screen beyond what the OS / SafeAreaView provides).
- The screen renders correctly using only navigation params — no AsyncStorage reads occur on mount.
- Layout holds on a Pixel 8 Pro (the project's target device per memory) in portrait orientation with no clipped content.
- Implemented with functional components, NativeWind classes, and the project-standard fonts; the lotus is rendered via `react-native-svg`.

## Open Questions
- Should "Return Home" actually `navigation.popToTop()` / `reset` to make the Complete screen non-returnable, or should it just `navigate('Home')` and leave the stack as-is? Default: reset, so users do not accidentally go back into a finished session. 
- Should the lotus icon be reused as a shared component (it may show up on other screens) or kept local to this screen? Default: keep local; 
- Does "View Statistics" need to also reset the stack, or can the user navigate back from Statistics to Complete? Default: User cannot navigate back from statistics.

## Testing Guidelines
Create a test file in the `./tests` folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `CompleteScreen` renders without crashing when given valid `duration`, `streakCount`, and `date` params.
- The duration row renders the value as `${duration} min`.
- The date row renders a string formatted with weekday + month + day (assert against a known mocked date, e.g. `new Date(2026, 3, 26)` → "Sunday, April 26").
- The streak row renders `${streakCount} consecutive days`, including the value `0` when streak is zero.
- The "Return Home" button is pressable and triggers a navigation reset / pop to the Home route (mock the navigation prop and assert the call).
- The "View Statistics" button is pressable and navigates to the Statistics route.
- Falls back gracefully when `date` is omitted: the row still renders a non-empty formatted date string.
- Do not test the lotus SVG path data or animations; rendering presence is sufficient.

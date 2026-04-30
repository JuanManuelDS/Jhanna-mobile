# Spec for home-screen

branch: claude/feature/home-screen
design reference: _specs/design-assets/home-page/jhanna-timer/project/home-page.html

## Summary
Build the static UI of the Home / Timer Setup screen — the first screen of the Jhanna meditation timer app. This spec covers visual layout and component structure only. No functionality (timer logic, AsyncStorage persistence, navigation actions, streak calculation, audio) is required at this stage; values can be hardcoded placeholders. The screen must match the reference design in look and feel, using NativeWind for styling and the project's defined color palette.

## Functional Requirements

### Screen-level
- Create `src/screens/HomeScreen.js` as a functional React Native component.
- Wire it as the initial screen so `expo start` opens directly on it.
- Background uses Cream `#F5E6D3` filling the full screen.
- Vertical flex layout with four stacked regions (top to bottom): header, hero, pickers, begin button.

### 1. Header (top region)
- Horizontal row, space-between, with safe top padding (~40px equivalent).
- **Left — Streak badge:**
  - Pill-shaped container with a soft warm-gold tint background and a thin gold border, rounded ~20px.
  - Flame icon (use `@expo/vector-icons` — e.g. MaterialCommunityIcons "fire" — tinted terracotta `#E8936A`).
  - Number (hardcoded placeholder, e.g. `14`) in warm brown `#A0654A`, semi-bold.
  - Small label "day streak" in sand `#C8A96E`, lighter weight.
- **Right — Statistics button:**
  - Rectangular button with subtle warm-brown tinted background (~10% opacity), rounded ~12px.
  - Label "Statistics" in warm brown `#A0654A`, medium weight, ~12px.
  - Bar-chart icon to the right of the label, tinted warm brown.
  - Pressable surface (no navigation behavior wired up yet — `onPress` can be a no-op).

### 2. Hero section (middle, takes remaining vertical space)
- Centered vertically and horizontally.
- **Breathing orb:**
  - Circular element ~110px diameter with a radial gradient blending terracotta and warm-gold tints, with a thin terracotta border.
  - A nested inner orb (~78px) inside, also with a soft radial gradient and border.
  - A lotus glyph (🪷 emoji or equivalent icon) centered inside the orb at ~28px.
  - Slow, gentle breathing animation: 6-second loop scaling between 1.0 and ~1.08 with a subtle opacity pulse. The inner orb pulses with a slight (~0.3s) phase offset. Use `react-native-reanimated` for the loop.
- **Soft divider:** thin 40px-wide horizontal line below the orb, sand color at low opacity.
- **Greeting text:**
  - Two lines, centered.
  - First line: "Good morning,", "Good afternoon," or "Good evening," depending on the device's current hour (<12 / <17 / else). Warm brown, serif display font, ~28px.
  - Second line: italic "be still." in terracotta.
  - If a serif display font is not yet wired up, use the system serif fallback and leave a TODO; no need to add custom fonts in this spec.
- **Sub text:** "Your practice awaits" centered below, 12px, sand color, slightly tracked.

### 3. Pickers section
- Two stacked cards with a small gap (~12px), padded horizontally (~20px).
- Each card:
  - Off-white translucent background (~`#FFF8F0` at ~80% opacity), thin gold border, rounded ~20px, internal padding ~16px x 20px.
  - **Left side (label group):** uppercase tracked label (e.g. "PREPARATION") in sand color, plus a smaller sub-label below in muted warm brown.
  - **Right side (controls):** a `−` button, the numeric value with its unit, and a `+` button, in a row with ~14px gap.
  - **Picker buttons:** 32x32, rounded 10px, transparent background, 1.5px gold border, `−` / `+` glyphs in warm brown. They are visual only — no increment/decrement behavior required yet.
  - **Picker value:** large serif number (~28px) in warm brown, with a small unit label below ("min" or "sec") in sand color.
- **Card 1 — Preparation:** label "PREPARATION", sublabel "Settle into stillness", display value "1" with unit "min".
- **Card 2 — Meditation:** label "MEDITATION", sublabel "Jhanna practice", display value "10" with unit "min".

### 4. Begin button (bottom region)
- Full-width pressable, padded horizontally (~20px) and bottom (~28px).
- Solid terracotta `#E8936A` background, rounded ~22px, vertical padding ~18px.
- Centered row containing the label "Begin Session" in off-white `#FFF8F0` (medium weight, ~16px) and a play-triangle icon to the right.
- Soft drop shadow tinted terracotta below the button (`shadowColor: '#E8936A'`, low opacity, large radius).
- Pressed state: slight scale-down (~0.98) and reduced shadow. `onPress` can be a no-op.

## Design Reference
- Source HTML/JSX: `_specs/design-assets/home-page/jhanna-timer/project/home-page.html` (full canonical reference; consult it for exact hex values, sizes, and spacing).
- Color palette is defined in `.claude/CLAUDE.md` and must be respected: Cream `#F5E6D3`, Tan/Sand `#C8A96E`, Warm Gold `#D4B856`, Terracotta `#E8936A`, Muted Coral `#D4796A`, Warm Brown `#A0654A`. An off-white `#FFF8F0` is also used for button text and card backgrounds.
- Typography in the reference uses DM Sans (body/labels/buttons) and DM Serif Display (greeting and picker numbers). Wiring custom fonts is out of scope for this spec — system sans-serif and serif fallbacks are acceptable, but the visual hierarchy (sizes, weights, italic emphasis) must be preserved.

## Possible Edge Cases
- Small-screen devices (e.g. iPhone SE): the hero section flexes to fill remaining space — verify the orb, greeting, and sub-text remain visible without overflow and that the begin button stays pinned to the bottom region.
- Tall-screen devices (e.g. modern iPhones with large notches): the header must clear the safe-area inset; use `SafeAreaView` or an equivalent inset-aware wrapper.
- Android vs iOS: shadow rendering differs; use `elevation` for Android and `shadow*` props for iOS on the Begin button.
- System dark mode: the screen always renders in its warm-light palette regardless of the OS appearance setting. No dark variant in this scope.
- Dynamic Type / accessibility text scaling: text should not break the layout when the system font scale is increased one notch. Allow text to wrap rather than fixing widths where possible.
- Greeting boundary times: ensure exactly 12:00 returns "Good afternoon" and exactly 17:00 returns "Good evening" (matches the `<` comparisons in the reference).

## Acceptance Criteria
- Running `expo start` and opening the app shows the Home screen as the initial route.
- The four regions (header, hero, pickers, begin) are present and visually match the reference design.
- The streak badge renders the placeholder number `14` and the label "day streak".
- The Statistics button shows the label and bar-chart icon and is pressable (no-op handler).
- The breathing orb is centered, contains the lotus glyph, and breathes with a smooth 6-second loop.
- The greeting text picks the correct phrase based on the device's current local hour, with the second-line "be still." in italic terracotta.
- The two picker cards show the correct labels, sublabels, values (`1 min` and `10 min`), and `−`/`+` buttons. The buttons are visible and pressable but do not change the value.
- The Begin button is full-width, terracotta, says "Begin Session", has a play icon, and has a visible shadow. It is pressable (no-op handler).
- Layout holds on both iOS and Android in portrait orientation, on at least one small-screen and one large-screen device profile, with no clipped content or overlapping elements.
- All styling is implemented with NativeWind classes; `StyleSheet.create` is used only where NativeWind cannot express a property (e.g. native shadow props, the breathing animation, radial gradients).

## Open Questions
- Should the breathing orb's radial gradient be implemented with `react-native-svg` (true radial gradient) or approximated with `expo-linear-gradient` plus opacity layers? The reference relies on CSS `radial-gradient`, which has no direct RN equivalent. RESPONSE: take the simpler approach
- Are DM Sans and DM Serif Display intended to be added now, or deferred to a later styling pass? CLAUDE.md does not list custom fonts in the tech stack. RESPONSE: add them now
- Should the lotus visual be the 🪷 emoji (renders inconsistently across platforms) or a custom SVG asset? RESPONSE: the emoji is fine
- Streak badge number, picker default values, and "Statistics" navigation are placeholders for this UI-only pass — confirm that wiring them to Zustand/AsyncStorage/React Navigation is intentionally deferred to subsequent specs. RESPONSE: yes, functionality will be added later.

## Testing Guidelines
Create a test file in the `./tests` folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- `HomeScreen` renders without crashing.
- The streak badge renders the expected placeholder count and "day streak" label.
- The Statistics button renders with its label and is pressable.
- Both picker cards render with their correct labels, sublabels, values, and units.
- The Begin button renders with the text "Begin Session" and is pressable.
- The greeting text matches the expected phrase for a mocked hour in each of the three time windows (morning, afternoon, evening) — mock `Date` to verify each branch.

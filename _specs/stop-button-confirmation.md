# Spec for stop-button-confirmation

branch: claude/feature/stop-button-confirmation
figma_component (if used): n/a — design reference is the HTML mock at `_specs/design-assets/Jhanna Timer - Stop Confirm.html`

## Summary

The Active Session screen currently has a "Stop" control that does not match the warm, minimal visual language defined in the design mock, and tapping it ends the session immediately with no confirmation. This spec covers two related changes:

1. Update the Pause and Stop buttons on the Active Session screen so they match the styling shown in the design mock (rounded pill buttons in terracotta and muted coral, sitting at the bottom of the screen).
2. Introduce a "End Session?" confirmation popup that appears when the user taps Stop, so the session is only ended after explicit confirmation.

The intent is to make the act of ending a meditation feel intentional and calm, while keeping the running session paused (but not yet discarded) while the popup is open.

## Functional Requirements

### Pause / Stop buttons (Active Session screen)
- Two pill-shaped buttons sit side by side, horizontally centered, anchored toward the bottom of the screen.
- Left button: **Pause / Resume** — terracotta background, cream label. Toggles between "Pause" (while running) and "Resume" (while paused).
- Right button: **Stop** — muted coral background, cream label.
- Both buttons share the same shape, padding, font weight, and letter-spacing; only the background color and label differ.
- Buttons give subtle visual feedback when pressed (press-down scale).
- When the session is paused, a small "PAUSED" indicator appears above the buttons (per the existing design mock) and gently pulses.

### Stop confirmation popup
- Tapping **Stop** must:
  1. Pause the running countdown (so time does not continue counting down behind the popup).
  2. Open a centered modal popup over the session screen with a dimmed, blurred backdrop.
- The popup contains:
  - A small circular icon area at the top with a coral-tinted square/stop glyph.
  - Title: **"End Session?"**
  - Supporting text: **"Your progress for this session will be saved."**
  - Primary action button: **"End Session"** (filled coral, full width inside popup).
  - Secondary action button: **"Continue"** (transparent with a soft cream outline, full width inside popup).
- Tapping **End Session** confirms stopping: the session ends and the user is taken through the existing session-ended flow (i.e. whatever happens today after Stop is pressed — saving the session if applicable, then leaving the active screen).
- Tapping **Continue** dismisses the popup and resumes the session from where it was paused.
- Tapping the dimmed backdrop outside the popup is equivalent to tapping **Continue** (dismiss + resume).
- The popup animates in (fade + subtle scale/translate) and the backdrop fades in; both should feel calm, not snappy.

## Figma Design Reference (only if referenced)
- File: `_specs/design-assets/Jhanna Timer - Stop Confirm.html`
- Component name: `MeditationScreen` + inline stop-confirmation modal in the same file
- Key visual constraints:
  - Colors must come from the project palette in `CLAUDE.md`: terracotta `#E8936A`, muted coral `#D4796A`, warm brown (cream-on-brown text) `#A0654A`, cream background `#F5E6D3`.
  - Pill buttons: rounded (~28px radius), generous horizontal padding, soft colored shadow matching the button hue.
  - Popup: rounded card (~20px radius), cream background, soft dark shadow, ~280px wide, vertically stacked buttons with ~10px gap, full-width inside the card.
  - Backdrop: warm dark translucent overlay (`rgba(30, 22, 16, 0.65)`) with blur.
  - Typography: light/medium weights, wide letter-spacing on small uppercase labels (e.g. PAUSED).

## Possible Edge Cases
- User taps **Stop** while the session is already paused — popup still opens; on **Continue**, session should remain paused (do not auto-resume something that was already paused before). 
- User taps **Stop** within the final second of a phase — the popup must still suppress phase advancement / bell while open.
- A phase transition (Preparation → Meditation) or session completion fires while the popup is open — countdown must not advance under the modal; it should only resume on **Continue**.
- Bell sound is already mid-ring when the user taps **Stop** — opening the popup should not abruptly cut the bell, but no new bells should ring while the popup is open.
- User rapidly double-taps **Stop** — only one popup instance should appear.
- Confirming **End Session** must not accidentally double-save the session or double-navigate away.
- Hardware back button / swipe-back gesture (Android / iOS) while the popup is open should behave as **Continue** (dismiss popup, do not end session).
- Popup must not be dismissable by phase auto-advance or by the screen losing focus (e.g. backgrounding the app); on resume the popup should still be visible.

## Acceptance Criteria
- The Pause and Stop buttons on the Active Session screen visually match the design mock: pill shape, correct colors, layout, and press feedback.
- Pause toggles to Resume when the session is paused, and back to Pause when running.
- Tapping Stop during a running session pauses the countdown and opens the confirmation popup.
- The popup matches the design mock: icon, title text, supporting text, two stacked buttons, dimmed blurred backdrop, calm fade-in animation.
- Tapping **End Session** in the popup ends the session (existing end-of-session behavior is preserved).
- Tapping **Continue** in the popup dismisses it and resumes the timer from the exact second it was paused at.
- Tapping the backdrop is equivalent to **Continue**.
- Hardware/system back gesture while popup is open dismisses popup as **Continue** (does not end the session).
- No countdown ticks, phase transitions, or bell sounds are triggered while the popup is open.
- All colors used come from the project palette defined in `CLAUDE.md`; no off-palette colors are introduced.

## Open Questions
- When the user confirms **End Session**, should the partial session be saved as a session record (per the popup copy "Your progress for this session will be saved"), or only sessions that fully completed the Meditation phase? Current data model in `CLAUDE.md` only describes completed sessions. Response: no, partial sessions should be saved as well, change that in the claude.md file yo reflect this.
- If partial sessions are saved, what counts as `duration` — elapsed meditation minutes only, or total elapsed including preparation? response: don't count preparation time
- Should partial sessions count toward the streak? response: yes
- After confirming End Session, where should the user land — Home screen, Session Complete screen, or a different "session ended early" screen? respone: session complete screen.
- Should the same confirmation popup also appear if the user uses a hardware back gesture to leave the Active Session screen mid-session? response: yes

## Testing Guidelines
Create a test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:
- Pause button toggles label between "Pause" and "Resume" and pauses/resumes the countdown.
- Tapping Stop while running opens the confirmation popup and pauses the countdown.
- Countdown does not advance while the popup is open (tick once, open popup, advance fake time, assert no decrement).
- Tapping **Continue** closes the popup and resumes the countdown from the value it had when Stop was tapped.
- Tapping the backdrop behaves identically to **Continue**.
- Tapping **End Session** triggers the end-of-session flow exactly once, even on rapid double-tap.
- Tapping Stop while already paused: popup opens; **Continue** leaves the session paused, not running.
- Snapshot/visual test (or styling assertions) confirming the Pause and Stop buttons use the terracotta and muted coral palette colors and pill shape.

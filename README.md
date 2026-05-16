# Jhanna

A personal mobile meditation timer built with React Native and Expo. No accounts, no backend — every session, streak, and setting lives on the device.
Keep track of your mediation habits with the stadistics. Also, predefined meditations sessions are offered with Goenka's audios and chantings.

## Features

- Configurable preparation and meditation phases with bell transitions
- Predefined meditations alongside custom timer sessions
- Animated circular countdown timer
- Streak tracking (current and longest), with partial sessions still counting
- Statistics screen with 14-day bar chart and session history
- Background-safe sessions: the timer keeps running with the screen off
- Calm, warm visual design with custom color palette and DM Sans / DM Serif Display fonts

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** React Navigation (stack)
- **State:** Zustand
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Storage:** AsyncStorage
- **Audio:** expo-av
- **Charts:** Victory Native + Skia
- **Animation:** react-native-reanimated, react-native-svg
- **Background work:** @notifee/react-native foreground service (Android)

## Project Structure

```
src/
├── components/   Reusable UI (CircularTimer, StatCard, TimePicker, ...)
├── hooks/        Custom React hooks
├── navigation/   Stack navigator config
├── screens/      HomeScreen, SessionScreen, CompleteScreen, StatsScreen
├── services/     Audio, background, persistence helpers
├── store/        Zustand store (useAppStore.js)
└── utils/        Streak, date, timer, and session helpers
assets/           Bell sounds, icons, splash
tests/            Jest + React Native Testing Library
plugins/          Custom Expo config plugin (foreground service)
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Run on a device or simulator:

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator / device
npm run web       # Web (limited support)
```

## Testing

```bash
npm test
```

Tests use `jest-expo` with `@testing-library/react-native`. Setup lives in `tests/setup.js`.

## Data Model

All persisted state is stored under a single AsyncStorage namespace:

```json
{
  "settings":  { "prepTime": 1, "meditationTime": 10 },
  "sessions":  [{ "date": "2026-04-26", "duration": 10, "timestamp": 1745654400000 }],
  "streak":    { "current": 5, "longest": 12 }
}
```

- `duration` counts meditation time only — preparation never counts.
- Partial sessions (ended early via Stop confirmation) are saved when ≥ 1 second of meditation has elapsed, rounded up to 1 minute.
- A day counts toward the streak if it has at least one completed or partial session.

## License

[MIT](./LICENSE) © Juan Manuel De Senzi

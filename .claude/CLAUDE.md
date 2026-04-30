# Meditation Timer App

## Project Overview
A personal mobile meditation timer app built for daily use. No authentication, no backend — all data stored on-device.

## Tech Stack
- **Framework:** React Native + Expo (managed workflow)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand
- **Navigation:** React Navigation (stack navigator)
- **Local Storage:** AsyncStorage
- **Audio:** expo-av
- **Charts:** Victory Native
- **Icons:** @expo/vector-icons
- **Animations:** react-native-reanimated + react-native-svg

## Color Palette
| Name       | Hex       | Usage                          |
|------------|-----------|--------------------------------|
| Cream      | `#F5E6D3` | Backgrounds                    |
| Tan/Sand   | `#C8A96E` | Cards, secondary elements      |
| Warm Gold  | `#D4B856` | Accents, progress arcs, chart lines |
| Terracotta | `#E8936A` | Primary buttons, chart bars    |
| Muted Coral| `#D4796A` | Secondary buttons, highlights  |
| Warm Brown | `#A0654A` | Text, icons, outlines          |

## App Screens (4 total)

### 1. Home / Timer Setup
- Streak counter (consecutive days) with flame icon at top
- Two time pickers with +/− buttons: "Preparation time" (default 1 min) and "Meditation time" (default 10 min)
- Last-used values pre-loaded from AsyncStorage
- Large "Begin" button in terracotta
- Small icon to navigate to Statistics screen

### 2. Active Session
- Full-screen, deep warm brown background
- Large circular countdown timer with animated arc (react-native-svg + reanimated)
- Phase label: "Preparation" or "Meditation"
- Bell sound plays at phase transition (prep → meditation) and at session end (expo-av)
- Pause/resume and stop buttons only — no distractions

### 3. Session Complete
- Card showing: checkmark/lotus icon, "Session Complete", duration, date, updated streak
- Two buttons: "Return Home" and "View Statistics"

### 4. Statistics / History
- Three stat cards: Current Streak, Longest Streak, Total Sessions
- Bar chart (Victory Native): daily meditation minutes for last 14 days
- Scrollable list of past sessions (date + duration)
- Back arrow to return home

## Data Model (AsyncStorage)

```json
{
  "settings": {
    "prepTime": 1,
    "meditationTime": 10
  },
  "sessions": [
    {
      "date": "2026-04-26",
      "duration": 10,
      "timestamp": 1745654400000
    }
  ],
  "streak": {
    "current": 5,
    "longest": 12
  }
}
```

## Streak Logic
- A day counts if at least one completed session exists for that date
- Streak increments if the user meditated yesterday and today
- Streak resets to 1 if the user missed a full calendar day
- Longest streak updates whenever current streak surpasses it

## Audio
- Use two bell sound files: `bell_start.mp3` and `bell_end.mp3`
- Bell plays once when preparation ends and meditation begins
- Bell plays once when meditation ends
- Load sounds with `Audio.Sound.createAsync()` from expo-av

## Code Style
- Functional components only, no classes
- All styling with NativeWind classes (no StyleSheet.create unless NativeWind doesn't cover it)
- Keep each screen in its own file under `src/screens/`
- Zustand store in `src/store/`
- Shared components in `src/components/`
- Navigation config in `src/navigation/`

## File Structure
```
src/
├── components/       # Reusable components (TimePicker, StatCard, etc.)
├── navigation/       # React Navigation stack config
├── screens/          # HomeScreen, SessionScreen, CompleteScreen, StatsScreen
├── store/            # Zustand store (useAppStore.js)
├── assets/           # Bell sound files
└── utils/            # Streak calculation, date helpers
```

## Important Notes
- This is a personal project — no auth, no API, no backend
- All persistence is local via AsyncStorage
- The app should feel calm, warm, and minimal at all times
- Prefer simplicity over features — no overengineering

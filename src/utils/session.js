import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeStreakUpdate } from './streak';
import { todayLocalISO } from './date';

const KEYS = {
  sessions: 'sessions',
  streak: 'streak',
  settings: 'settings',
};

const DEFAULT_STREAK = { current: 0, longest: 0 };

export async function recordCompletedSession({ durationMinutes }) {
  try {
    const [rawSessions, rawStreak] = await Promise.all([
      AsyncStorage.getItem(KEYS.sessions),
      AsyncStorage.getItem(KEYS.streak),
    ]);

    const sessions = rawSessions ? JSON.parse(rawSessions) : [];
    const prevStreak = rawStreak ? JSON.parse(rawStreak) : DEFAULT_STREAK;
    const today = todayLocalISO();

    const newSession = {
      date: today,
      duration: durationMinutes,
      timestamp: Date.now(),
    };

    const updatedSessions = [...sessions, newSession];
    const updatedStreak = computeStreakUpdate(updatedSessions, prevStreak, today);

    await Promise.all([
      AsyncStorage.setItem(KEYS.sessions, JSON.stringify(updatedSessions)),
      AsyncStorage.setItem(KEYS.streak, JSON.stringify(updatedStreak)),
    ]);

    return { duration: durationMinutes, streak: updatedStreak };
  } catch (e) {
    console.warn('recordCompletedSession failed:', e);
    return { duration: durationMinutes, streak: DEFAULT_STREAK };
  }
}

export async function loadStorageData() {
  try {
    const [rawSessions, rawStreak, rawSettings] = await Promise.all([
      AsyncStorage.getItem(KEYS.sessions),
      AsyncStorage.getItem(KEYS.streak),
      AsyncStorage.getItem(KEYS.settings),
    ]);
    return {
      sessions: rawSessions ? JSON.parse(rawSessions) : [],
      streak: rawStreak ? JSON.parse(rawStreak) : DEFAULT_STREAK,
      settings: rawSettings ? JSON.parse(rawSettings) : { prepTime: 1, meditationTime: 10 },
    };
  } catch (e) {
    console.warn('loadStorageData failed:', e);
    return {
      sessions: [],
      streak: DEFAULT_STREAK,
      settings: { prepTime: 1, meditationTime: 10 },
    };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch (e) {
    console.warn('saveSettings failed:', e);
  }
}

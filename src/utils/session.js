import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeStreakUpdate } from './streak';
import { todayLocalISO } from './date';
import { DEFAULT_START_BELL, DEFAULT_END_BELL, resolveBellName } from './bells';

const KEYS = {
  sessions: 'sessions',
  streak: 'streak',
  settings: 'settings',
  sessionDefaults: 'sessionDefaults',
};

const DEFAULT_STREAK = { current: 0, longest: 0 };

const DEFAULT_SETTINGS = {
  prepSeconds: 60,
  meditationTime: 10,
  startBell: DEFAULT_START_BELL,
  endBell: DEFAULT_END_BELL,
};

const DEFAULT_SESSION_DEFAULTS = {
  lastPredefinedId: null,
};

function migrateSettings(raw) {
  if (!raw) return { ...DEFAULT_SETTINGS };
  const next = { ...DEFAULT_SETTINGS, ...raw };

  // Migrate legacy `prepTime` (minutes) → `prepSeconds`.
  if (raw.prepSeconds == null && typeof raw.prepTime === 'number') {
    next.prepSeconds = Math.max(5, Math.min(600, Math.round(raw.prepTime * 60)));
  }
  delete next.prepTime;

  next.startBell = resolveBellName(next.startBell);
  next.endBell = resolveBellName(next.endBell);

  if (typeof next.meditationTime !== 'number' || next.meditationTime < 1) {
    next.meditationTime = DEFAULT_SETTINGS.meditationTime;
  }
  if (typeof next.prepSeconds !== 'number' || next.prepSeconds < 5) {
    next.prepSeconds = DEFAULT_SETTINGS.prepSeconds;
  }

  return next;
}

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
    const [rawSessions, rawStreak, rawSettings, rawSessionDefaults] = await Promise.all([
      AsyncStorage.getItem(KEYS.sessions),
      AsyncStorage.getItem(KEYS.streak),
      AsyncStorage.getItem(KEYS.settings),
      AsyncStorage.getItem(KEYS.sessionDefaults),
    ]);

    const settings = migrateSettings(rawSettings ? JSON.parse(rawSettings) : null);

    // Persist migration result so legacy keys are dropped.
    if (rawSettings && JSON.stringify(JSON.parse(rawSettings)) !== JSON.stringify(settings)) {
      await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
    }

    return {
      sessions: rawSessions ? JSON.parse(rawSessions) : [],
      streak: rawStreak ? JSON.parse(rawStreak) : DEFAULT_STREAK,
      settings,
      sessionDefaults: rawSessionDefaults
        ? { ...DEFAULT_SESSION_DEFAULTS, ...JSON.parse(rawSessionDefaults) }
        : { ...DEFAULT_SESSION_DEFAULTS },
    };
  } catch (e) {
    console.warn('loadStorageData failed:', e);
    return {
      sessions: [],
      streak: DEFAULT_STREAK,
      settings: { ...DEFAULT_SETTINGS },
      sessionDefaults: { ...DEFAULT_SESSION_DEFAULTS },
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

export async function saveSessionDefaults(defaults) {
  try {
    await AsyncStorage.setItem(KEYS.sessionDefaults, JSON.stringify(defaults));
  } catch (e) {
    console.warn('saveSessionDefaults failed:', e);
  }
}

export { DEFAULT_SETTINGS, DEFAULT_SESSION_DEFAULTS };

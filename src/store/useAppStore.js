import { create } from 'zustand';
import {
  loadStorageData,
  recordCompletedSession,
  saveSettings,
  saveSessionDefaults,
  DEFAULT_SETTINGS,
  DEFAULT_SESSION_DEFAULTS,
} from '../utils/session';
import { todayLocalISO } from '../utils/date';

const useAppStore = create((set, get) => ({
  sessions: [],
  streak: { current: 0, longest: 0 },
  settings: { ...DEFAULT_SETTINGS },
  sessionDefaults: { ...DEFAULT_SESSION_DEFAULTS },
  hydrated: false,

  hydrate: async () => {
    const data = await loadStorageData();
    set({ ...data, hydrated: true });
  },

  commitCompletedSession: async ({ durationMinutes }) => {
    const result = await recordCompletedSession({ durationMinutes });
    const { sessions } = get();
    set({
      sessions: [
        ...sessions,
        { date: todayLocalISO(), duration: durationMinutes, timestamp: Date.now() },
      ],
      streak: result.streak,
    });
    return result;
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    await saveSettings(next);
    set({ settings: next });
  },

  updateSessionDefaults: async (patch) => {
    const next = { ...get().sessionDefaults, ...patch };
    await saveSessionDefaults(next);
    set({ sessionDefaults: next });
  },
}));

export default useAppStore;

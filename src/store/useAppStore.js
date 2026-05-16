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

  // Transient active-session state (not persisted). Shape when non-null:
  // { id, startedAt, prepSec, medSec, isPredefined, bellSound,
  //   pausedAccumMs, pauseStartedAt }
  activeSession: null,

  beginSession: ({ id, startedAt, prepSec, medSec, isPredefined, bellSound }) =>
    set({
      activeSession: {
        id,
        startedAt,
        prepSec,
        medSec,
        isPredefined,
        bellSound,
        pausedAccumMs: 0,
        pauseStartedAt: null,
      },
    }),

  pauseSession: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, pauseStartedAt: Date.now() }
        : null,
    })),

  resumeSession: () =>
    set((state) => {
      if (!state.activeSession) return {};
      const { pauseStartedAt, pausedAccumMs } = state.activeSession;
      const extra = pauseStartedAt != null ? Date.now() - pauseStartedAt : 0;
      return {
        activeSession: {
          ...state.activeSession,
          pausedAccumMs: pausedAccumMs + extra,
          pauseStartedAt: null,
        },
      };
    }),

  clearSession: () => set({ activeSession: null }),

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

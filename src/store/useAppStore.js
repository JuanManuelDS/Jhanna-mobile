import { create } from 'zustand';
import { loadStorageData, recordCompletedSession } from '../utils/session';

const useAppStore = create((set, get) => ({
  sessions: [],
  streak: { current: 0, longest: 0 },
  settings: { prepTime: 1, meditationTime: 10 },
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
        { date: result.streak ? undefined : null, duration: durationMinutes, timestamp: Date.now() },
      ],
      streak: result.streak,
    });
    return result;
  },
}));

export default useAppStore;

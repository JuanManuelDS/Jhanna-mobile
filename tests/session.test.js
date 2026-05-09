import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  recordCompletedSession,
  loadStorageData,
  saveSettings,
  saveSessionDefaults,
  DEFAULT_SETTINGS,
} from '../src/utils/session';
import { DEFAULT_START_BELL, DEFAULT_END_BELL } from '../src/utils/bells';

beforeEach(() => {
  AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('recordCompletedSession', () => {
  it('writes a session entry to empty storage', async () => {
    const result = await recordCompletedSession({ durationMinutes: 10 });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const rawSessions = JSON.parse(AsyncStorage.setItem.mock.calls.find(([k]) => k === 'sessions')[1]);
    expect(rawSessions).toHaveLength(1);
    expect(rawSessions[0].duration).toBe(10);
    expect(rawSessions[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof rawSessions[0].timestamp).toBe('number');
  });

  it('returns the updated streak in the result', async () => {
    const result = await recordCompletedSession({ durationMinutes: 10 });
    expect(result.streak).toBeDefined();
    expect(typeof result.streak.current).toBe('number');
    expect(typeof result.streak.longest).toBe('number');
  });

  it('writes the correct duration for a partial (stopped) session', async () => {
    await recordCompletedSession({ durationMinutes: 4 });

    const rawSessions = JSON.parse(AsyncStorage.setItem.mock.calls.find(([k]) => k === 'sessions')[1]);
    expect(rawSessions[0].duration).toBe(4);
  });

  it('appends to existing sessions', async () => {
    const existing = [{ date: '2026-04-30', duration: 10, timestamp: 1000 }];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'sessions') return Promise.resolve(JSON.stringify(existing));
      return Promise.resolve(null);
    });

    await recordCompletedSession({ durationMinutes: 15 });

    const rawSessions = JSON.parse(AsyncStorage.setItem.mock.calls.find(([k]) => k === 'sessions')[1]);
    expect(rawSessions).toHaveLength(2);
    expect(rawSessions[1].duration).toBe(15);
  });

  it('increments streak when yesterday session exists', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const yDate = `${yyyy}-${mm}-${dd}`;

    const existingSessions = [{ date: yDate, duration: 10, timestamp: 1000 }];
    const existingStreak = { current: 3, longest: 5 };

    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'sessions') return Promise.resolve(JSON.stringify(existingSessions));
      if (key === 'streak') return Promise.resolve(JSON.stringify(existingStreak));
      return Promise.resolve(null);
    });

    const result = await recordCompletedSession({ durationMinutes: 10 });
    expect(result.streak.current).toBe(4);
    expect(result.streak.longest).toBe(5);
  });

});

describe('loadStorageData', () => {
  let mem;
  beforeEach(() => {
    mem = {};
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.clear.mockReset();
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(mem[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => {
      mem[k] = v;
      return Promise.resolve();
    });
    AsyncStorage.clear.mockImplementation(() => {
      Object.keys(mem).forEach((k) => delete mem[k]);
      return Promise.resolve();
    });
  });

  it('returns defaults when storage is empty', async () => {
    const data = await loadStorageData();
    expect(data.settings).toEqual({
      prepSeconds: 60,
      meditationTime: 10,
      startBell: DEFAULT_START_BELL,
      endBell: DEFAULT_END_BELL,
    });
    expect(data.sessionDefaults).toEqual({ lastPredefinedId: null });
    expect(data.sessions).toEqual([]);
  });

  it('migrates legacy prepTime (minutes) into prepSeconds', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({ prepTime: 2, meditationTime: 15 })
    );

    const data = await loadStorageData();
    expect(data.settings.prepSeconds).toBe(120);
    expect(data.settings.prepTime).toBeUndefined();
    expect(data.settings.meditationTime).toBe(15);
    expect(data.settings.startBell).toBe(DEFAULT_START_BELL);
    expect(data.settings.endBell).toBe(DEFAULT_END_BELL);

    // migration result is persisted back
    const persisted = JSON.parse(await AsyncStorage.getItem('settings'));
    expect(persisted.prepSeconds).toBe(120);
    expect(persisted.prepTime).toBeUndefined();
  });

  it('falls back to defaults if AsyncStorage throws', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('boom'));
    const data = await loadStorageData();
    expect(data.settings.prepSeconds).toBe(60);
    expect(data.settings.meditationTime).toBe(10);
  });

  it('substitutes default bell when stored bell name is unknown', async () => {
    await AsyncStorage.setItem(
      'settings',
      JSON.stringify({ prepSeconds: 60, meditationTime: 10, startBell: 'Ghost', endBell: 'Phantom' })
    );
    const data = await loadStorageData();
    expect(data.settings.startBell).toBe(DEFAULT_START_BELL);
    expect(data.settings.endBell).toBe(DEFAULT_START_BELL); // unknown → default start
  });
});

describe('saveSettings & saveSessionDefaults', () => {
  let mem;
  beforeEach(() => {
    mem = {};
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.getItem.mockImplementation((k) => Promise.resolve(mem[k] ?? null));
    AsyncStorage.setItem.mockImplementation((k, v) => {
      mem[k] = v;
      return Promise.resolve();
    });
  });

  it('saveSettings persists settings to AsyncStorage', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, prepSeconds: 90 });
    const raw = JSON.parse(await AsyncStorage.getItem('settings'));
    expect(raw.prepSeconds).toBe(90);
  });

  it('saveSessionDefaults persists session defaults', async () => {
    await saveSessionDefaults({ lastPredefinedId: 3 });
    const raw = JSON.parse(await AsyncStorage.getItem('sessionDefaults'));
    expect(raw.lastPredefinedId).toBe(3);
  });
});

describe('legacy gap-day streak (kept)', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('resets streak to 1 when there is a gap day', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const yyyy = twoDaysAgo.getFullYear();
    const mm = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
    const dd = String(twoDaysAgo.getDate()).padStart(2, '0');
    const oldDate = `${yyyy}-${mm}-${dd}`;

    const existingSessions = [{ date: oldDate, duration: 10, timestamp: 1000 }];
    const existingStreak = { current: 5, longest: 10 };

    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'sessions') return Promise.resolve(JSON.stringify(existingSessions));
      if (key === 'streak') return Promise.resolve(JSON.stringify(existingStreak));
      return Promise.resolve(null);
    });

    const result = await recordCompletedSession({ durationMinutes: 10 });
    expect(result.streak.current).toBe(1);
    expect(result.streak.longest).toBe(10);
  });
});

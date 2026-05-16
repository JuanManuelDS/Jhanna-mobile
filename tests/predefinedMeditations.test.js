import {
  PREDEFINED_MEDITATIONS,
  PREDEFINED_KIND,
  getPredefinedById,
  computeAudioStartOffsetSec,
  getPredefinedAudioDurationMs,
  _resetPredefinedAudioDurationCache,
} from '../src/utils/predefinedMeditations';

describe('PREDEFINED_MEDITATIONS catalog', () => {
  it('contains exactly 11 entries', () => {
    expect(PREDEFINED_MEDITATIONS).toHaveLength(11);
  });

  it('first entry is Short Instructions', () => {
    const first = PREDEFINED_MEDITATIONS[0];
    expect(first.id).toBe('short-instructions');
    expect(first.name).toBe('Short Instructions');
    expect(first.kind).toBe(PREDEFINED_KIND.SHORT_INSTRUCTIONS);
    expect(first.meditationTime).toBeNull();
  });

  it('entries 2 through 11 are Day 1 → Day 10 in order', () => {
    for (let i = 1; i <= 10; i++) {
      const entry = PREDEFINED_MEDITATIONS[i];
      expect(entry.id).toBe(`day-${i}`);
      expect(entry.name).toBe(`Day ${i} Chantings`);
      expect(entry.kind).toBe(PREDEFINED_KIND.DAY_CHANTING);
      expect(entry.meditationTime).toBe(60);
    }
  });

  it('every entry has the required fields and 30s prep', () => {
    for (const m of PREDEFINED_MEDITATIONS) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(m.prepTime).toBe(30);
      expect(m.audio).toBeTruthy();
    }
  });

  it('all ids are unique', () => {
    const ids = PREDEFINED_MEDITATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getPredefinedById', () => {
  it('returns the matching meditation by id', () => {
    expect(getPredefinedById('day-1')).toBe(PREDEFINED_MEDITATIONS[1]);
    expect(getPredefinedById('short-instructions')).toBe(PREDEFINED_MEDITATIONS[0]);
  });

  it('returns null for unknown id', () => {
    expect(getPredefinedById('not-a-real-id')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(getPredefinedById(null)).toBeNull();
    expect(getPredefinedById(undefined)).toBeNull();
  });

  it('returns null for legacy numeric ids', () => {
    expect(getPredefinedById(1)).toBeNull();
    expect(getPredefinedById(99)).toBeNull();
  });
});

describe('computeAudioStartOffsetSec', () => {
  it('returns 0 for Short Instructions regardless of audio length', () => {
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.SHORT_INSTRUCTIONS, 7 * 60)).toBe(0);
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.SHORT_INSTRUCTIONS, 0)).toBe(0);
  });

  it('returns 60min - audioDuration for Day chantings', () => {
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.DAY_CHANTING, 33 * 60)).toBe(27 * 60);
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.DAY_CHANTING, 43 * 60)).toBe(17 * 60);
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.DAY_CHANTING, 60 * 60)).toBe(0);
  });

  it('clamps to 0 when audio longer than 60 min', () => {
    expect(computeAudioStartOffsetSec(PREDEFINED_KIND.DAY_CHANTING, 70 * 60)).toBe(0);
  });

  it('returns 0 for unknown kind', () => {
    expect(computeAudioStartOffsetSec('unknown', 100)).toBe(0);
  });
});

describe('getPredefinedAudioDurationMs', () => {
  beforeEach(() => {
    _resetPredefinedAudioDurationCache();
  });

  it('returns null for unknown id', async () => {
    const ms = await getPredefinedAudioDurationMs('not-real');
    expect(ms).toBeNull();
  });

  it('reads durationMillis from the loaded sound and unloads it', async () => {
    const { Audio } = require('expo-av');
    const unloadAsync = jest.fn(() => Promise.resolve());
    Audio.Sound.createAsync.mockImplementationOnce(() =>
      Promise.resolve({
        sound: { unloadAsync, setOnPlaybackStatusUpdate: jest.fn() },
        status: { durationMillis: 12345 },
      })
    );
    const ms = await getPredefinedAudioDurationMs('short-instructions');
    expect(ms).toBe(12345);
    expect(unloadAsync).toHaveBeenCalled();
  });

  it('falls back to getStatusAsync when initial status has no durationMillis', async () => {
    const { Audio } = require('expo-av');
    const unloadAsync = jest.fn(() => Promise.resolve());
    const getStatusAsync = jest.fn(() =>
      Promise.resolve({ isLoaded: true, durationMillis: 54321 })
    );
    Audio.Sound.createAsync.mockImplementationOnce(() =>
      Promise.resolve({
        sound: { unloadAsync, setOnPlaybackStatusUpdate: jest.fn(), getStatusAsync },
        status: {},
      })
    );
    const ms = await getPredefinedAudioDurationMs('short-instructions');
    expect(ms).toBe(54321);
    expect(getStatusAsync).toHaveBeenCalled();
    expect(unloadAsync).toHaveBeenCalled();
  });

  it('caches duration so a second call does not re-load', async () => {
    const { Audio } = require('expo-av');
    Audio.Sound.createAsync.mockClear();
    Audio.Sound.createAsync.mockImplementationOnce(() =>
      Promise.resolve({
        sound: { unloadAsync: jest.fn(() => Promise.resolve()), setOnPlaybackStatusUpdate: jest.fn() },
        status: { durationMillis: 9000 },
      })
    );
    const a = await getPredefinedAudioDurationMs('day-1');
    const b = await getPredefinedAudioDurationMs('day-1');
    expect(a).toBe(9000);
    expect(b).toBe(9000);
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1);
  });
});

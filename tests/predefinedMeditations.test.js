import {
  PREDEFINED_MEDITATIONS,
  getPredefinedById,
} from '../src/utils/predefinedMeditations';
import { BELL_NAMES } from '../src/utils/bells';

describe('PREDEFINED_MEDITATIONS', () => {
  it('contains at least 6 entries', () => {
    expect(PREDEFINED_MEDITATIONS.length).toBeGreaterThanOrEqual(6);
  });

  it('every entry has the required fields with valid types', () => {
    for (const m of PREDEFINED_MEDITATIONS) {
      expect(typeof m.id).toBe('number');
      expect(typeof m.name).toBe('string');
      expect(typeof m.description).toBe('string');
      expect(typeof m.prepTime).toBe('number');
      expect(m.prepTime).toBeGreaterThanOrEqual(5);
      expect(m.prepTime).toBeLessThanOrEqual(600);
      expect(typeof m.meditationTime).toBe('number');
      expect(m.meditationTime).toBeGreaterThanOrEqual(1);
      expect(m.meditationTime).toBeLessThanOrEqual(240);
    }
  });

  it('every bell reference is a known bell name', () => {
    for (const m of PREDEFINED_MEDITATIONS) {
      expect(BELL_NAMES).toContain(m.startBell);
      expect(BELL_NAMES).toContain(m.endBell);
    }
  });

  it('all ids are unique', () => {
    const ids = PREDEFINED_MEDITATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getPredefinedById', () => {
  it('returns the matching meditation by id', () => {
    const m = getPredefinedById(PREDEFINED_MEDITATIONS[0].id);
    expect(m).toBe(PREDEFINED_MEDITATIONS[0]);
  });

  it('returns null for unknown id', () => {
    expect(getPredefinedById(99999)).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(getPredefinedById(null)).toBeNull();
    expect(getPredefinedById(undefined)).toBeNull();
  });
});

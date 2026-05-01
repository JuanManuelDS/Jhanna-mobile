import { phaseAt, formatMSS } from '../src/utils/timer';

describe('phaseAt', () => {
  const PREP = 60;
  const MED = 600;

  it('returns preparation phase mid-prep', () => {
    const result = phaseAt(PREP, MED, 30);
    expect(result.phase).toBe('preparation');
    expect(result.remainingSeconds).toBe(30);
  });

  it('transitions to meditation at the exact boundary (elapsed === prepSec)', () => {
    const result = phaseAt(PREP, MED, 60);
    expect(result.phase).toBe('meditation');
    expect(result.remainingSeconds).toBe(MED);
  });

  it('returns meditation phase mid-meditation', () => {
    const result = phaseAt(PREP, MED, 90);
    expect(result.phase).toBe('meditation');
    expect(result.remainingSeconds).toBe(570);
  });

  it('returns complete when elapsed covers both phases', () => {
    const result = phaseAt(PREP, MED, PREP + MED);
    expect(result.phase).toBe('complete');
    expect(result.remainingSeconds).toBe(0);
  });

  it('returns complete for elapsed beyond total', () => {
    const result = phaseAt(PREP, MED, PREP + MED + 100);
    expect(result.phase).toBe('complete');
    expect(result.remainingSeconds).toBe(0);
  });

  describe('skip-prep (prepSec === 0)', () => {
    it('starts in meditation phase with full remaining', () => {
      const result = phaseAt(0, MED, 0);
      expect(result.phase).toBe('meditation');
      expect(result.remainingSeconds).toBe(MED);
    });

    it('returns complete when meditation finishes', () => {
      const result = phaseAt(0, MED, MED);
      expect(result.phase).toBe('complete');
      expect(result.remainingSeconds).toBe(0);
    });
  });
});

describe('formatMSS', () => {
  it('formats 0 as 0:00', () => expect(formatMSS(0)).toBe('0:00'));
  it('formats 65 as 1:05', () => expect(formatMSS(65)).toBe('1:05'));
  it('formats 600 as 10:00', () => expect(formatMSS(600)).toBe('10:00'));
  it('formats 599 as 9:59', () => expect(formatMSS(599)).toBe('9:59'));
});

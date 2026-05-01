import { computeStreakUpdate } from '../src/utils/streak';

const streak = (current, longest) => ({ current, longest });

describe('computeStreakUpdate', () => {
  it('returns unchanged streak when today has no session', () => {
    const result = computeStreakUpdate([], streak(3, 5), '2026-05-01');
    expect(result).toEqual(streak(3, 5));
  });

  it('increments streak when yesterday and today both have sessions', () => {
    const sessions = [
      { date: '2026-04-30', duration: 10 },
      { date: '2026-05-01', duration: 10 },
    ];
    const result = computeStreakUpdate(sessions, streak(3, 5), '2026-05-01');
    expect(result.current).toBe(4);
    expect(result.longest).toBe(5);
  });

  it('resets to 1 when there is a gap day', () => {
    const sessions = [
      { date: '2026-04-29', duration: 10 },
      { date: '2026-05-01', duration: 10 },
    ];
    const result = computeStreakUpdate(sessions, streak(3, 5), '2026-05-01');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(5);
  });

  it('updates longest when current surpasses it', () => {
    const sessions = [
      { date: '2026-04-30', duration: 10 },
      { date: '2026-05-01', duration: 10 },
    ];
    const result = computeStreakUpdate(sessions, streak(5, 5), '2026-05-01');
    expect(result.current).toBe(6);
    expect(result.longest).toBe(6);
  });

  it('same-day double session does not double-count streak', () => {
    const sessions = [
      { date: '2026-04-30', duration: 10 },
      { date: '2026-05-01', duration: 5 },
      { date: '2026-05-01', duration: 5 },
    ];
    const result = computeStreakUpdate(sessions, streak(3, 5), '2026-05-01');
    expect(result.current).toBe(4);
  });
});

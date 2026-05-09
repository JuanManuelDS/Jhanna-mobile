import {
  formatMins,
  getDailyBuckets,
  getWeeklyBuckets,
  getMonthlyBuckets,
  getCumulativeSeries,
} from '../src/utils/chartData';

const TODAY = '2026-05-02';

describe('formatMins', () => {
  it('formats sub-hour values as "{m} min"', () => {
    expect(formatMins(45)).toBe('45 min');
    expect(formatMins(0)).toBe('0 min');
  });

  it('formats whole hours as "{h}h"', () => {
    expect(formatMins(60)).toBe('1h');
    expect(formatMins(120)).toBe('2h');
  });

  it('formats hours + minutes as "{h}h {r} m"', () => {
    expect(formatMins(150)).toBe('2h 30 m');
    expect(formatMins(75)).toBe('1h 15 m');
  });
});

describe('getDailyBuckets', () => {
  it('returns N entries for the last N days', () => {
    expect(getDailyBuckets([], TODAY, 14)).toHaveLength(14);
    expect(getDailyBuckets([], TODAY, 7)).toHaveLength(7);
  });

  it('days with no sessions produce 0-value entries', () => {
    const data = getDailyBuckets([], TODAY, 7);
    data.forEach((d) => expect(d.mins).toBe(0));
  });

  it('aggregates minutes for multiple sessions on the same day', () => {
    const sessions = [
      { date: TODAY, duration: 10, timestamp: 1 },
      { date: TODAY, duration: 15, timestamp: 2 },
    ];
    const data = getDailyBuckets(sessions, TODAY, 7);
    expect(data[data.length - 1].mins).toBe(25);
  });

  it('excludes sessions older than the window', () => {
    const sessions = [{ date: '2026-04-01', duration: 30, timestamp: 1 }];
    const data = getDailyBuckets(sessions, TODAY, 14);
    const total = data.reduce((sum, d) => sum + d.mins, 0);
    expect(total).toBe(0);
  });

  it('last entry corresponds to the anchor date', () => {
    const sessions = [{ date: TODAY, duration: 5, timestamp: 1 }];
    const data = getDailyBuckets(sessions, TODAY, 7);
    expect(data[data.length - 1].mins).toBe(5);
  });

  it('labels each bucket with a single-letter day-of-week initial', () => {
    const data = getDailyBuckets([], TODAY, 7);
    data.forEach((d) => expect(d.label).toMatch(/^[SMTWF]$/));
  });
});

describe('getWeeklyBuckets', () => {
  it('groups sessions into Monday-anchored week buckets', () => {
    // 2026-05-02 is a Saturday. Its week (Mon-Sun): Apr 27 → May 3.
    // 2026-04-26 is a Sunday → previous week (Apr 20 → Apr 26).
    const sessions = [
      { date: '2026-04-27', duration: 10, timestamp: 1 },
      { date: '2026-04-28', duration: 5, timestamp: 2 },
      { date: '2026-04-26', duration: 20, timestamp: 3 },
    ];
    const data = getWeeklyBuckets(sessions, TODAY, 14);
    const lastWeek = data[data.length - 1];
    const prevWeek = data[data.length - 2];
    expect(lastWeek.mins).toBe(15);
    expect(prevWeek.mins).toBe(20);
  });

  it('uses month abbreviation when the bucket starts a new month', () => {
    // The Monday of TODAY's week is 2026-04-27 — same month as previous Monday (Apr 20),
    // so label should be the day-of-month "27", not "Apr".
    const data = getWeeklyBuckets([], TODAY, 14);
    expect(data[data.length - 1].label).toBe('27');
    // Find a bucket where the Monday crosses a month boundary; check that it uses
    // a 3-letter month abbreviation.
    const monthLabels = data.filter((d) => /^[A-Z][a-z]{2}$/.test(d.label));
    expect(monthLabels.length).toBeGreaterThan(0);
  });

  it('returns the configured number of buckets', () => {
    expect(getWeeklyBuckets([], TODAY, 14)).toHaveLength(14);
    expect(getWeeklyBuckets([], TODAY, 4)).toHaveLength(4);
  });
});

describe('getMonthlyBuckets', () => {
  it('groups sessions into calendar month buckets', () => {
    const sessions = [
      { date: '2026-03-15', duration: 30, timestamp: 1 },
      { date: '2026-03-20', duration: 10, timestamp: 2 },
      { date: '2026-04-01', duration: 25, timestamp: 3 },
      { date: '2026-05-02', duration: 5, timestamp: 4 },
    ];
    const data = getMonthlyBuckets(sessions, TODAY, 12);
    expect(data).toHaveLength(12);
    const may = data[data.length - 1];
    const apr = data[data.length - 2];
    const mar = data[data.length - 3];
    expect(may.mins).toBe(5);
    expect(apr.mins).toBe(25);
    expect(mar.mins).toBe(40);
  });

  it('labels months with three-letter abbreviations', () => {
    const data = getMonthlyBuckets([], TODAY, 12);
    data.forEach((d) => expect(d.label).toMatch(/^[A-Z][a-z]{2}$/));
    expect(data[data.length - 1].label).toBe('May');
  });
});

describe('getCumulativeSeries', () => {
  it('returns a baseline pair when there are no sessions', () => {
    const data = getCumulativeSeries([], TODAY, 12);
    expect(data).toHaveLength(2);
    data.forEach((d) => expect(d.cumulative).toBe(0));
  });

  it('produces a monotonically non-decreasing series', () => {
    const sessions = [
      { date: '2024-01-15', duration: 10, timestamp: 1 },
      { date: '2024-06-10', duration: 20, timestamp: 2 },
      { date: '2025-03-05', duration: 15, timestamp: 3 },
      { date: '2025-12-20', duration: 30, timestamp: 4 },
      { date: '2026-04-30', duration: 5, timestamp: 5 },
    ];
    const data = getCumulativeSeries(sessions, TODAY, 12);
    for (let i = 1; i < data.length; i++) {
      expect(data[i].cumulative).toBeGreaterThanOrEqual(data[i - 1].cumulative);
    }
  });

  it('final value equals the sum of all session durations', () => {
    const sessions = [
      { date: '2024-01-15', duration: 10, timestamp: 1 },
      { date: '2025-03-05', duration: 25, timestamp: 2 },
      { date: '2026-04-30', duration: 5, timestamp: 3 },
    ];
    const data = getCumulativeSeries(sessions, TODAY, 12);
    expect(data[data.length - 1].cumulative).toBe(40);
  });
});

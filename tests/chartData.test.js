import { getBarChartData } from '../src/utils/chartData';

const TODAY = '2026-05-02';

describe('getBarChartData', () => {
  it('returns N entries for the last N days', () => {
    expect(getBarChartData([], 14, TODAY)).toHaveLength(14);
    expect(getBarChartData([], 7, TODAY)).toHaveLength(7);
  });

  it('days with no sessions produce 0-value entries', () => {
    const data = getBarChartData([], 7, TODAY);
    data.forEach((d) => expect(d.mins).toBe(0));
  });

  it('aggregates minutes correctly for multiple sessions on the same day', () => {
    const sessions = [
      { date: TODAY, duration: 10, timestamp: 1 },
      { date: TODAY, duration: 15, timestamp: 2 },
    ];
    const data = getBarChartData(sessions, 7, TODAY);
    expect(data[data.length - 1].mins).toBe(25);
  });

  it('excludes sessions older than the window', () => {
    const sessions = [{ date: '2026-04-01', duration: 30, timestamp: 1 }];
    const data = getBarChartData(sessions, 14, TODAY);
    const total = data.reduce((sum, d) => sum + d.mins, 0);
    expect(total).toBe(0);
  });

  it('includes sessions within the window on the correct day', () => {
    const sessions = [{ date: '2026-04-26', duration: 20, timestamp: 1 }];
    const data = getBarChartData(sessions, 14, TODAY);
    const entry = data.find((d) => d.mins > 0);
    expect(entry).toBeDefined();
    expect(entry.mins).toBe(20);
  });

  it('last entry corresponds to today', () => {
    const sessions = [{ date: TODAY, duration: 5, timestamp: 1 }];
    const data = getBarChartData(sessions, 7, TODAY);
    expect(data[data.length - 1].mins).toBe(5);
  });
});

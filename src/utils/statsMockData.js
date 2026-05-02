export const RANGE_OPTIONS = [
  { label: 'Last 7 days',   value: '7d' },
  { label: 'Last 14 days',  value: '14d' },
  { label: 'Last 30 days',  value: '30d' },
  { label: 'Last 3 months', value: '3m' },
];

export const ALL_BAR_DATA = {
  '7d': [
    { day: 'Apr 20', mins: 35 },
    { day: 'Apr 21', mins: 20 },
    { day: 'Apr 22', mins: 40 },
    { day: 'Apr 23', mins: 15 },
    { day: 'Apr 24', mins: 22 },
    { day: 'Apr 25', mins: 28 },
    { day: 'Apr 26', mins: 12 },
  ],
  '14d': [
    { day: 'Apr 13', mins: 10 },
    { day: 'Apr 14', mins: 20 },
    { day: 'Apr 15', mins: 15 },
    { day: 'Apr 16', mins: 30 },
    { day: 'Apr 17', mins: 25 },
    { day: 'Apr 18', mins: 0 },
    { day: 'Apr 19', mins: 18 },
    { day: 'Apr 20', mins: 35 },
    { day: 'Apr 21', mins: 20 },
    { day: 'Apr 22', mins: 40 },
    { day: 'Apr 23', mins: 15 },
    { day: 'Apr 24', mins: 22 },
    { day: 'Apr 25', mins: 28 },
    { day: 'Apr 26', mins: 12 },
  ],
  '30d': [
    { day: 'Mar 28', mins: 18 }, { day: 'Mar 29', mins: 0 },  { day: 'Mar 30', mins: 22 },
    { day: 'Mar 31', mins: 30 }, { day: 'Apr 01', mins: 15 }, { day: 'Apr 02', mins: 25 },
    { day: 'Apr 03', mins: 10 }, { day: 'Apr 04', mins: 0 },  { day: 'Apr 05', mins: 35 },
    { day: 'Apr 06', mins: 20 }, { day: 'Apr 07', mins: 18 }, { day: 'Apr 08', mins: 40 },
    { day: 'Apr 09', mins: 12 }, { day: 'Apr 10', mins: 28 }, { day: 'Apr 11', mins: 22 },
    { day: 'Apr 12', mins: 0 },  { day: 'Apr 13', mins: 10 }, { day: 'Apr 14', mins: 20 },
    { day: 'Apr 15', mins: 15 }, { day: 'Apr 16', mins: 30 }, { day: 'Apr 17', mins: 25 },
    { day: 'Apr 18', mins: 0 },  { day: 'Apr 19', mins: 18 }, { day: 'Apr 20', mins: 35 },
    { day: 'Apr 21', mins: 20 }, { day: 'Apr 22', mins: 40 }, { day: 'Apr 23', mins: 15 },
    { day: 'Apr 24', mins: 22 }, { day: 'Apr 25', mins: 28 }, { day: 'Apr 26', mins: 12 },
  ],
  '3m': [
    { day: 'Jan 27', mins: 20 }, { day: 'Feb 03', mins: 15 }, { day: 'Feb 10', mins: 30 },
    { day: 'Feb 17', mins: 0 },  { day: 'Feb 24', mins: 25 }, { day: 'Mar 03', mins: 18 },
    { day: 'Mar 10', mins: 35 }, { day: 'Mar 17', mins: 22 }, { day: 'Mar 24', mins: 40 },
    { day: 'Mar 31', mins: 28 }, { day: 'Apr 07', mins: 20 }, { day: 'Apr 14', mins: 15 },
    { day: 'Apr 21', mins: 38 }, { day: 'Apr 26', mins: 12 },
  ],
};

export const SESSIONS = [
  { id: 1,  date: 'Apr 26, 2026', time: '7:02 AM',  duration: '12 min', type: 'Morning Calm' },
  { id: 2,  date: 'Apr 25, 2026', time: '6:48 AM',  duration: '28 min', type: 'Deep Focus' },
  { id: 3,  date: 'Apr 24, 2026', time: '9:15 PM',  duration: '22 min', type: 'Sleep Prep' },
  { id: 4,  date: 'Apr 23, 2026', time: '7:30 AM',  duration: '15 min', type: 'Morning Calm' },
  { id: 5,  date: 'Apr 22, 2026', time: '6:00 AM',  duration: '40 min', type: 'Body Scan' },
  { id: 6,  date: 'Apr 21, 2026', time: '8:20 AM',  duration: '20 min', type: 'Breathwork' },
  { id: 7,  date: 'Apr 20, 2026', time: '7:10 AM',  duration: '35 min', type: 'Deep Focus' },
  { id: 8,  date: 'Apr 19, 2026', time: '9:00 PM',  duration: '18 min', type: 'Sleep Prep' },
  { id: 9,  date: 'Apr 17, 2026', time: '7:55 AM',  duration: '25 min', type: 'Morning Calm' },
  { id: 10, date: 'Apr 16, 2026', time: '6:30 AM',  duration: '30 min', type: 'Body Scan' },
];

export const STATS = { current: 14, longest: 31, total: 87 };

export function calcChartVars(data) {
  const nonZero = data.filter((d) => d.mins > 0);
  const avg = nonZero.length
    ? Math.round(nonZero.reduce((s, d) => s + d.mins, 0) / nonZero.length)
    : 0;
  const maxMins = Math.max(...data.map((d) => d.mins), 1);
  return { avg, maxMins };
}

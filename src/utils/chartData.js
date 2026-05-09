const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMins(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r} m` : `${h}h`;
}

export function calcChartVars(data) {
  const nonZero = data.filter((d) => d.mins > 0);
  const avg = nonZero.length
    ? Math.round(nonZero.reduce((s, d) => s + d.mins, 0) / nonZero.length)
    : 0;
  const maxMins = Math.max(...data.map((d) => d.mins), 1);
  return { avg, maxMins };
}

export function getDailyBuckets(sessions, anchorISO, count = 14) {
  const byDate = sumByDate(sessions);
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const dateISO = addDays(anchorISO, -i);
    const dow = parseISO(dateISO).getDay();
    result.push({
      key: dateISO,
      label: DAY_INITIALS[dow],
      mins: byDate[dateISO] || 0,
    });
  }
  return result;
}

export function getWeeklyBuckets(sessions, anchorISO, count = 14) {
  const byDate = sumByDate(sessions);
  const anchorMonday = mondayOf(anchorISO);
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const weekStart = addDays(anchorMonday, -i * 7);
    let mins = 0;
    for (let d = 0; d < 7; d++) {
      const dayISO = addDays(weekStart, d);
      mins += byDate[dayISO] || 0;
    }
    const startDate = parseISO(weekStart);
    const isFirstWeekOfMonth = startsNewMonth(weekStart);
    const label = isFirstWeekOfMonth
      ? MONTH_ABBR[startDate.getMonth()]
      : String(startDate.getDate());
    result.push({ key: weekStart, label, mins });
  }
  return result;
}

export function getMonthlyBuckets(sessions, anchorISO, count = 12) {
  const byMonth = {};
  for (const s of sessions) {
    const mk = s.date.slice(0, 7);
    byMonth[mk] = (byMonth[mk] || 0) + s.duration;
  }
  const anchor = parseISO(anchorISO);
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      key,
      label: MONTH_ABBR[d.getMonth()],
      mins: byMonth[key] || 0,
    });
  }
  return result;
}

export function getCumulativeSeries(sessions, anchorISO, samples = 12) {
  const total = sessions.reduce((sum, s) => sum + s.duration, 0);
  if (sessions.length === 0) {
    return [
      { x: 0, cumulative: 0, label: '' },
      { x: 1, cumulative: 0, label: '' },
    ];
  }

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const firstISO = sorted[0].date;
  const firstMs = parseISO(firstISO).getTime();
  const anchorMs = parseISO(anchorISO).getTime();
  const span = Math.max(anchorMs - firstMs, 1);

  const cumByDate = {};
  let running = 0;
  const byDate = sumByDate(sessions);
  const dates = Object.keys(byDate).sort();
  for (const d of dates) {
    running += byDate[d];
    cumByDate[d] = running;
  }

  let lastSeenYear = null;
  const result = [];
  for (let i = 0; i < samples; i++) {
    const t = samples === 1 ? 1 : i / (samples - 1);
    const ms = firstMs + t * span;
    const sampleISO = isoFromMs(ms);
    const cumulative = cumulativeAt(sampleISO, cumByDate, dates);
    const year = sampleISO.slice(0, 4);
    const label = year !== lastSeenYear ? year : '';
    if (year !== lastSeenYear) lastSeenYear = year;
    result.push({ x: i, cumulative, label });
  }

  if (result.length > 0) result[result.length - 1].cumulative = total;
  return result;
}

function sumByDate(sessions) {
  const byDate = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] || 0) + s.duration;
  }
  return byDate;
}

function cumulativeAt(sampleISO, cumByDate, sortedDates) {
  let cum = 0;
  for (const d of sortedDates) {
    if (d <= sampleISO) cum = cumByDate[d];
    else break;
  }
  return cum;
}

function parseISO(iso) {
  return new Date(iso + 'T00:00:00');
}

function isoFromMs(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso, days) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return isoFromMs(d.getTime());
}

function mondayOf(iso) {
  const d = parseISO(iso);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(iso, offset);
}

function startsNewMonth(iso) {
  const d = parseISO(iso);
  const prev = new Date(d.getTime());
  prev.setDate(d.getDate() - 7);
  return d.getMonth() !== prev.getMonth();
}

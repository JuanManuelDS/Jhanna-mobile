export function getBarChartData(sessions, days, todayISO) {
  const byDate = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] || 0) + s.duration;
  }
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = offsetDate(todayISO, -i);
    result.push({ day: formatShortDate(date), mins: byDate[date] || 0 });
  }
  return result;
}

export function calcChartVars(data) {
  const nonZero = data.filter((d) => d.mins > 0);
  const avg = nonZero.length
    ? Math.round(nonZero.reduce((s, d) => s + d.mins, 0) / nonZero.length)
    : 0;
  const maxMins = Math.max(...data.map((d) => d.mins), 1);
  return { avg, maxMins };
}

function offsetDate(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

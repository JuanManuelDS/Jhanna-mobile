// Returns updated { current, longest } given past sessions and today's date.
// todayISO: "YYYY-MM-DD"
export function computeStreakUpdate(sessions, prevStreak, todayISO) {
  const dates = new Set(sessions.map((s) => s.date));

  if (!dates.has(todayISO)) {
    return prevStreak;
  }

  const yesterday = offsetDate(todayISO, -1);
  const current = dates.has(yesterday) ? prevStreak.current + 1 : 1;
  const longest = Math.max(prevStreak.longest, current);
  return { current, longest };
}

function offsetDate(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

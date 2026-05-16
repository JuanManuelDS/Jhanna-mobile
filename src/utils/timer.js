export function phaseAt(prepSec, medSec, elapsedSec) {
  if (prepSec > 0 && elapsedSec < prepSec) {
    return { phase: 'preparation', remainingSeconds: prepSec - elapsedSec, overtimeSeconds: 0 };
  }

  const medElapsed = elapsedSec - (prepSec > 0 ? prepSec : 0);
  const remaining = Math.max(0, medSec - medElapsed);
  const overtime = Math.max(0, medElapsed - medSec);
  return { phase: 'meditation', remainingSeconds: remaining, overtimeSeconds: overtime };
}

export function formatMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

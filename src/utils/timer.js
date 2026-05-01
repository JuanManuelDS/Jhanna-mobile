export function phaseAt(prepSec, medSec, elapsedSec) {
  if (prepSec === 0) {
    const remaining = Math.max(0, medSec - elapsedSec);
    return {
      phase: remaining === 0 ? 'complete' : 'meditation',
      remainingSeconds: remaining,
    };
  }

  if (elapsedSec < prepSec) {
    return { phase: 'preparation', remainingSeconds: prepSec - elapsedSec };
  }

  const medElapsed = elapsedSec - prepSec;
  const remaining = Math.max(0, medSec - medElapsed);
  return {
    phase: remaining === 0 ? 'complete' : 'meditation',
    remainingSeconds: remaining,
  };
}

export function formatMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

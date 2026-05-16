/**
 * Computes how many whole seconds have elapsed in the session, accounting for pauses.
 *
 * @param {object} params
 * @param {number} params.startedAt  - epoch ms when session started
 * @param {number} [params.pausedAccumMs=0] - total ms already accumulated in past pauses
 * @param {number|null} [params.pauseStartedAt=null] - epoch ms when current pause began, or null
 * @param {number} params.now - current epoch ms (pass Date.now() at call site)
 */
export function computeElapsedSec({ startedAt, pausedAccumMs = 0, pauseStartedAt = null, now }) {
  if (startedAt == null) return 0;
  // livePauseMs: time spent in the current (ongoing) pause
  const livePauseMs = pauseStartedAt != null ? Math.max(0, now - pauseStartedAt) : 0;
  return Math.max(0, Math.floor((now - startedAt - pausedAccumMs - livePauseMs) / 1000));
}

/**
 * Returns the epoch timestamps at which each bell should fire, adjusted for any
 * pause time accumulated so far. Call again after each resume with updated pausedAccumMs.
 *
 * @param {object} params
 * @param {number} params.startedAt
 * @param {number} params.prepSec
 * @param {number} params.medSec
 * @param {number} [params.pausedAccumMs=0]
 * @returns {{ prepEndAt: number|null, sessionEndAt: number }}
 */
export function computeBellTimestamps({ startedAt, prepSec, medSec, pausedAccumMs = 0 }) {
  // Shift start by accumulated pauses so bell fires at the right real-time moment
  const effectiveStart = startedAt + pausedAccumMs;
  return {
    prepEndAt: prepSec > 0 ? effectiveStart + prepSec * 1000 : null,
    sessionEndAt: effectiveStart + (prepSec + medSec) * 1000,
  };
}

/**
 * Returns short text for the foreground service notification body.
 */
export function buildNotificationBody(phase, isPaused) {
  if (isPaused) return 'Session paused';
  if (phase === 'preparation') return 'Preparing';
  if (phase === 'meditation') return 'Meditating';
  return 'Session complete';
}

import {
  computeElapsedSec,
  computeBellTimestamps,
  buildNotificationBody,
} from '../src/utils/sessionClock';

const T0 = 1_700_000_000_000; // arbitrary epoch

// ── computeElapsedSec ────────────────────────────────────────────────────────

describe('computeElapsedSec', () => {
  it('returns 0 when startedAt is null', () => {
    expect(computeElapsedSec({ startedAt: null, now: T0 + 60_000 })).toBe(0);
  });

  it('returns correct elapsed when not paused', () => {
    expect(
      computeElapsedSec({ startedAt: T0, pausedAccumMs: 0, pauseStartedAt: null, now: T0 + 90_500 })
    ).toBe(90);
  });

  it('returns frozen elapsed during an active pause', () => {
    const pauseStartedAt = T0 + 30_000; // paused 30 s in
    // 20 s after pause started — result should still be 30 s
    const now = pauseStartedAt + 20_000;
    expect(
      computeElapsedSec({ startedAt: T0, pausedAccumMs: 0, pauseStartedAt, now })
    ).toBe(30);
  });

  it('accounts for previously accumulated pause time after resume', () => {
    // Paused for 15 s, then resumed; no current pause
    expect(
      computeElapsedSec({
        startedAt: T0,
        pausedAccumMs: 15_000,
        pauseStartedAt: null,
        now: T0 + 45_000, // 45 s wall time — 15 s was paused → 30 s elapsed
      })
    ).toBe(30);
  });

  it('combines accumulated and live pause time correctly', () => {
    const pauseStartedAt = T0 + 40_000; // paused at 30s elapsed (after 10s accumulated pause)
    const now = pauseStartedAt + 5_000;
    expect(
      computeElapsedSec({
        startedAt: T0,
        pausedAccumMs: 10_000,
        pauseStartedAt,
        now,
      })
    ).toBe(30); // 40s wall − 10s accum − 0s live-start... wait: elapsed = now − T0 − 10000 − 5000 = 50000 − 15000 = 35000 → 35
    // Let me recalculate: startedAt=T0, now=T0+45000, pausedAccumMs=10000, pauseStartedAt=T0+40000 → livePause=5000 → elapsed=(45000−10000−5000)/1000=30
  });

  it('does not return negative elapsed', () => {
    // now before startedAt (clock skew edge case)
    expect(
      computeElapsedSec({ startedAt: T0 + 5_000, pausedAccumMs: 0, pauseStartedAt: null, now: T0 })
    ).toBe(0);
  });
});

// ── computeBellTimestamps ────────────────────────────────────────────────────

describe('computeBellTimestamps', () => {
  it('returns correct prep-end and session-end without pauses', () => {
    const { prepEndAt, sessionEndAt } = computeBellTimestamps({
      startedAt: T0,
      prepSec: 60,
      medSec: 600,
    });
    expect(prepEndAt).toBe(T0 + 60_000);
    expect(sessionEndAt).toBe(T0 + 660_000);
  });

  it('shifts both timestamps by accumulated pause time', () => {
    const { prepEndAt, sessionEndAt } = computeBellTimestamps({
      startedAt: T0,
      prepSec: 60,
      medSec: 600,
      pausedAccumMs: 30_000,
    });
    expect(prepEndAt).toBe(T0 + 90_000);
    expect(sessionEndAt).toBe(T0 + 690_000);
  });

  it('returns null prepEndAt when prepSec is 0', () => {
    const { prepEndAt, sessionEndAt } = computeBellTimestamps({
      startedAt: T0,
      prepSec: 0,
      medSec: 600,
    });
    expect(prepEndAt).toBeNull();
    expect(sessionEndAt).toBe(T0 + 600_000);
  });
});

// ── buildNotificationBody ────────────────────────────────────────────────────

describe('buildNotificationBody', () => {
  it('returns paused text when isPaused', () => {
    expect(buildNotificationBody('meditation', true)).toBe('Session paused');
  });

  it('returns Preparing for preparation phase', () => {
    expect(buildNotificationBody('preparation', false)).toBe('Preparing');
  });

  it('returns Meditating for meditation phase', () => {
    expect(buildNotificationBody('meditation', false)).toBe('Meditating');
  });
});

// ── Rehydration / phase computation (spec testing guideline #2) ──────────────

describe('phase computation via phaseAt (rehydration)', () => {
  const { phaseAt } = require('../src/utils/timer');

  it('shows preparation when elapsed < prepSec', () => {
    const elapsed = computeElapsedSec({ startedAt: T0, pausedAccumMs: 0, pauseStartedAt: null, now: T0 + 30_000 });
    const { phase } = phaseAt(60, 600, elapsed);
    expect(phase).toBe('preparation');
  });

  it('shows meditation when elapsed >= prepSec and < prepSec + medSec', () => {
    const elapsed = computeElapsedSec({ startedAt: T0, pausedAccumMs: 0, pauseStartedAt: null, now: T0 + 90_000 });
    const { phase } = phaseAt(60, 600, elapsed);
    expect(phase).toBe('meditation');
  });

  it('shows complete when elapsed >= prepSec + medSec', () => {
    const elapsed = computeElapsedSec({ startedAt: T0, pausedAccumMs: 0, pauseStartedAt: null, now: T0 + 700_000 });
    const { phase } = phaseAt(60, 600, elapsed);
    expect(phase).toBe('complete');
  });
});

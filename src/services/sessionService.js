import useAppStore from '../store/useAppStore';
import * as notifeeService from './notifeeService';
import { computeBellTimestamps } from '../utils/sessionClock';
import { NONE_BELL } from '../utils/bells';

function getStore() {
  return useAppStore.getState();
}

function hasBell(bellSound) {
  return bellSound && bellSound !== NONE_BELL;
}

async function scheduleRemainingBells({ startedAt, prepSec, medSec, pausedAccumMs, bellSound }) {
  const { prepEndAt, sessionEndAt } = computeBellTimestamps({
    startedAt,
    prepSec,
    medSec,
    pausedAccumMs,
  });
  const now = Date.now();

  if (prepEndAt && prepEndAt > now) {
    await notifeeService
      .scheduleBell({
        notifId: 'bell-prep',
        title: 'Jhanna',
        body: 'Your meditation begins now.',
        timestamp: prepEndAt,
        bellName: bellSound,
      })
      .catch((e) => console.warn('scheduleBell prep failed:', e));
  }

  if (sessionEndAt > now) {
    await notifeeService
      .scheduleBell({
        notifId: 'bell-end',
        title: 'Jhanna',
        body: 'Your meditation is complete.',
        timestamp: sessionEndAt,
        bellName: bellSound,
      })
      .catch((e) => console.warn('scheduleBell end failed:', e));
  }
}

async function cancelBells() {
  await notifeeService.cancelTriggerNotification('bell-prep');
  await notifeeService.cancelTriggerNotification('bell-end');
}

/**
 * Call on session mount. Records start time in the store, starts the Android
 * foreground-service notification, and schedules bell alarms.
 */
export async function start({ prepSec, medSec, bellSound, isPredefined }) {
  const startedAt = Date.now();
  const id = `session-${startedAt}`;

  getStore().beginSession({ id, startedAt, prepSec, medSec, isPredefined, bellSound: bellSound ?? null });

  await notifeeService.requestPermission().catch(() => {});

  const body = prepSec > 0 ? 'Preparing' : 'Meditating';
  await notifeeService.startForegroundSession(body).catch((e) =>
    console.warn('startForegroundSession failed:', e)
  );

  if (!isPredefined && hasBell(bellSound)) {
    await scheduleRemainingBells({ startedAt, prepSec, medSec, pausedAccumMs: 0, bellSound });
  }
}

/**
 * Call when the user pauses. Freezes pause time in the store and cancels
 * pending bell alarms (they will be rescheduled on resume).
 */
export async function pause() {
  getStore().pauseSession();
  await cancelBells();
  await notifeeService.updateForegroundSession('Session paused').catch(() => {});
}

/**
 * Call when the user resumes. Accumulates pause time in the store and
 * re-schedules bell alarms with updated timestamps.
 */
export async function resume() {
  getStore().resumeSession();

  const { activeSession } = getStore();
  if (!activeSession) return;

  const { startedAt, prepSec, medSec, pausedAccumMs, bellSound, isPredefined } = activeSession;

  if (!isPredefined && hasBell(bellSound)) {
    await scheduleRemainingBells({ startedAt, prepSec, medSec, pausedAccumMs, bellSound });
  }

  const body = prepSec > 0 ? 'Preparing' : 'Meditating';
  await notifeeService.updateForegroundSession(body).catch(() => {});
}

/**
 * Call when phase transitions from preparation → meditation.
 * Updates the notification body to reflect the new phase.
 */
export function updatePhase() {
  notifeeService.updateForegroundSession('Meditating').catch(() => {});
}

/**
 * Call on session stop or completion. Cancels alarms, stops the foreground
 * service, and clears the active session from the store.
 */
export async function stop() {
  await cancelBells();
  await notifeeService.stopForeground().catch(() => {});
  getStore().clearSession();
}

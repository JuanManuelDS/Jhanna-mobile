import notifee from '@notifee/react-native';
import * as sessionService from '../src/services/sessionService';
import useAppStore from '../src/store/useAppStore';

// Reset store state between tests
beforeEach(() => {
  useAppStore.setState({
    activeSession: null,
    sessions: [],
    streak: { current: 0, longest: 0 },
  });
  jest.clearAllMocks();
});

// ── start ────────────────────────────────────────────────────────────────────

describe('sessionService.start', () => {
  it('calls beginSession on the store with correct shape', async () => {
    const before = Date.now();
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    const after = Date.now();

    const { activeSession } = useAppStore.getState();
    expect(activeSession).toBeTruthy();
    expect(activeSession.startedAt).toBeGreaterThanOrEqual(before);
    expect(activeSession.startedAt).toBeLessThanOrEqual(after);
    expect(activeSession.prepSec).toBe(60);
    expect(activeSession.medSec).toBe(600);
    expect(activeSession.pausedAccumMs).toBe(0);
    expect(activeSession.pauseStartedAt).toBeNull();
  });

  it('requests notification permission', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('starts the foreground service notification', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        android: expect.objectContaining({ asForegroundService: true }),
      })
    );
  });

  it('schedules both bell trigger notifications for non-predefined sessions', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(2);
    const ids = notifee.createTriggerNotification.mock.calls.map(([n]) => n.id);
    expect(ids).toContain('bell-prep');
    expect(ids).toContain('bell-end');
  });

  it('does NOT schedule bell triggers for predefined sessions', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: true });
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('does NOT schedule bell triggers when bellSound is None', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'None', isPredefined: false });
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });
});

// ── pause ────────────────────────────────────────────────────────────────────

describe('sessionService.pause', () => {
  it('sets pauseStartedAt in the store', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    const before = Date.now();
    await sessionService.pause();
    const after = Date.now();

    const { activeSession } = useAppStore.getState();
    expect(activeSession.pauseStartedAt).toBeGreaterThanOrEqual(before);
    expect(activeSession.pauseStartedAt).toBeLessThanOrEqual(after);
  });

  it('cancels both pending bell trigger notifications', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    jest.clearAllMocks();

    await sessionService.pause();
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('bell-prep');
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('bell-end');
  });
});

// ── resume ───────────────────────────────────────────────────────────────────

describe('sessionService.resume', () => {
  it('accumulates pause time and clears pauseStartedAt', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_700_000_000_000);

    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });

    jest.advanceTimersByTime(30_000); // 30 s pass
    await sessionService.pause();

    jest.advanceTimersByTime(10_000); // 10 s pause
    await sessionService.resume();

    const { activeSession } = useAppStore.getState();
    expect(activeSession.pausedAccumMs).toBeGreaterThanOrEqual(10_000);
    expect(activeSession.pauseStartedAt).toBeNull();

    jest.useRealTimers();
  });

  it('reschedules bell trigger notifications after resume', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_700_000_000_000);

    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    await sessionService.pause();
    jest.clearAllMocks();

    jest.advanceTimersByTime(5_000);
    await sessionService.resume();
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bell-end' }),
      expect.anything()
    );

    jest.useRealTimers();
  });
});

// ── stop ─────────────────────────────────────────────────────────────────────

describe('sessionService.stop', () => {
  it('cancels all pending bell notifications', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    jest.clearAllMocks();

    await sessionService.stop();
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('bell-prep');
    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('bell-end');
  });

  it('stops the foreground service', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    await sessionService.stop();
    expect(notifee.stopForegroundService).toHaveBeenCalledTimes(1);
  });

  it('clears activeSession from the store', async () => {
    await sessionService.start({ prepSec: 60, medSec: 600, bellSound: 'Grave', isPredefined: false });
    await sessionService.stop();
    expect(useAppStore.getState().activeSession).toBeNull();
  });
});

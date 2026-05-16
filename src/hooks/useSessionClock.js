import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import useAppStore from '../store/useAppStore';
import { computeElapsedSec } from '../utils/sessionClock';

/**
 * Returns the current elapsed seconds for the active session, recomputed from
 * the store's timestamp-anchored state. Ticks at ~500 ms so displayed seconds
 * advance promptly. Also re-syncs the moment the app returns to the foreground,
 * so the UI snaps to the correct time after a long screen-off.
 */
export function useSessionClock() {
  const activeSession = useAppStore((s) => s.activeSession);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') forceUpdate((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  if (!activeSession?.startedAt) return 0;
  return computeElapsedSec({ ...activeSession, now: Date.now() });
}

import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function useBells() {
  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { sound: startSound } = await Audio.Sound.createAsync(
          require('../assets/bell_start.mp3')
        );
        if (mounted) startRef.current = startSound;
      } catch (e) {
        console.warn('bell_start.mp3 failed to load:', e);
      }

      try {
        const { sound: endSound } = await Audio.Sound.createAsync(
          require('../assets/bell_end.mp3')
        );
        if (mounted) endRef.current = endSound;
      } catch (e) {
        console.warn('bell_end.mp3 failed to load:', e);
      }
    };

    load();

    return () => {
      mounted = false;
      startRef.current?.unloadAsync().catch(() => {});
      endRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const playStartBell = async () => {
    try {
      if (startRef.current) {
        await startRef.current.replayAsync();
      }
    } catch (e) {
      console.warn('playStartBell failed:', e);
    }
  };

  const playEndBell = async () => {
    try {
      if (endRef.current) {
        await endRef.current.replayAsync();
      }
    } catch (e) {
      console.warn('playEndBell failed:', e);
    }
  };

  return { playStartBell, playEndBell };
}

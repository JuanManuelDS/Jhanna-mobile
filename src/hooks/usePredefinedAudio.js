import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export function usePredefinedAudio({
  predefined,
  isPaused,
  inMeditationPhase,
  medElapsedSec,
  onAudioEnd,
} = {}) {
  const soundRef = useRef(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const onAudioEndRef = useRef(onAudioEnd);

  useEffect(() => {
    onAudioEndRef.current = onAudioEnd;
  }, [onAudioEnd]);

  const audio = predefined?.audio ?? null;

  useEffect(() => {
    if (!audio) return undefined;

    let cancelled = false;
    let localSound = null;

    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(audio, { shouldPlay: false });
        if (cancelled) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        localSound = sound;
        soundRef.current = sound;
        if (typeof sound.setOnPlaybackStatusUpdate === 'function') {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status?.didJustFinish && !finishedRef.current) {
              finishedRef.current = true;
              const cb = onAudioEndRef.current;
              if (typeof cb === 'function') cb();
            }
          });
        }
      } catch (e) {
        console.warn('predefined audio failed to load:', e);
      }
    })();

    return () => {
      cancelled = true;
      const target = localSound ?? soundRef.current;
      soundRef.current = null;
      startedRef.current = false;
      finishedRef.current = false;
      if (target) {
        (async () => {
          try { await target.stopAsync(); } catch (_) {}
          try { await target.unloadAsync(); } catch (_) {}
        })();
      }
    };
  }, [audio]);

  useEffect(() => {
    if (!predefined) return;
    const sound = soundRef.current;
    if (!sound) return;
    if (finishedRef.current) return;
    if (startedRef.current) return;
    if (!inMeditationPhase) return;
    if (isPaused) return;

    const offset = predefined.audioStartOffsetSec ?? 0;
    if (medElapsedSec >= offset) {
      startedRef.current = true;
      sound.playAsync().catch((e) => console.warn('predefined audio play failed:', e));
    }
  }, [predefined, isPaused, inMeditationPhase, medElapsedSec]);

  useEffect(() => {
    if (!startedRef.current) return;
    const sound = soundRef.current;
    if (!sound) return;
    if (isPaused) {
      sound.pauseAsync().catch(() => {});
    } else {
      sound.playAsync().catch((e) => console.warn('predefined audio resume failed:', e));
    }
  }, [isPaused]);

  // Background-stop intentionally removed: staysActiveInBackground=true lets
  // guided audio continue playing when the screen turns off.
}

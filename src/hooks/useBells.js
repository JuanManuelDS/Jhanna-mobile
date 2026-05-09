import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { getBellModule, NONE_BELL } from '../utils/bells';

export function useBells({ startBell, endBell } = {}) {
  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let loadedSound = null;

    const load = async () => {
      const mod = getBellModule(startBell);
      if (!mod) return;
      try {
        const { sound } = await Audio.Sound.createAsync(mod);
        if (!mounted) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        loadedSound = sound;
        startRef.current = sound;
      } catch (e) {
        console.warn('start bell failed to load:', startBell, e);
      }
    };

    load();

    return () => {
      mounted = false;
      const target = loadedSound ?? startRef.current;
      if (target) target.unloadAsync().catch(() => {});
      startRef.current = null;
    };
  }, [startBell]);

  useEffect(() => {
    let mounted = true;
    let loadedSound = null;

    const load = async () => {
      const mod = getBellModule(endBell);
      if (!mod) return;
      try {
        const { sound } = await Audio.Sound.createAsync(mod);
        if (!mounted) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        loadedSound = sound;
        endRef.current = sound;
      } catch (e) {
        console.warn('end bell failed to load:', endBell, e);
      }
    };

    load();

    return () => {
      mounted = false;
      const target = loadedSound ?? endRef.current;
      if (target) target.unloadAsync().catch(() => {});
      endRef.current = null;
    };
  }, [endBell]);

  const playStartBell = async () => {
    if (startBell === NONE_BELL) return;
    try {
      if (startRef.current) await startRef.current.replayAsync();
    } catch (e) {
      console.warn('playStartBell failed:', e);
    }
  };

  const playEndBell = async () => {
    if (endBell === NONE_BELL) return;
    try {
      if (endRef.current) await endRef.current.replayAsync();
    } catch (e) {
      console.warn('playEndBell failed:', e);
    }
  };

  return { playStartBell, playEndBell };
}

let currentPreviewSound = null;

export async function stopBellPreview() {
  const sound = currentPreviewSound;
  if (!sound) return;
  currentPreviewSound = null;
  try {
    await sound.stopAsync();
  } catch (e) {
    // ignore — sound may already be stopped/unloaded
  }
  sound.unloadAsync().catch(() => {});
}

export async function playBellPreview(name) {
  await stopBellPreview();
  if (name === NONE_BELL) return;
  const mod = getBellModule(name);
  if (!mod) return;
  let sound;
  try {
    const created = await Audio.Sound.createAsync(mod, { shouldPlay: true });
    sound = created.sound;
    currentPreviewSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        if (currentPreviewSound === sound) currentPreviewSound = null;
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (e) {
    console.warn('playBellPreview failed:', name, e);
    if (sound) {
      if (currentPreviewSound === sound) currentPreviewSound = null;
      sound.unloadAsync().catch(() => {});
    }
  }
}

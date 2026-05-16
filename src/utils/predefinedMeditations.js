export const PREDEFINED_KIND = {
  SHORT_INSTRUCTIONS: 'short',
  DAY_CHANTING: 'day',
};

const PREP_SECONDS = 30;
const DAY_TOTAL_SECONDS = 60 * 60;

export const PREDEFINED_MEDITATIONS = [
  {
    id: 'short-instructions',
    name: 'Short Instructions',
    kind: PREDEFINED_KIND.SHORT_INSTRUCTIONS,
    prepTime: PREP_SECONDS,
    meditationTime: null,
    audio: require('../../assets/audios/Short-Instr_English_GroupSitting_GroupSitting_Janani_2001.mp3'),
  },
  {
    id: 'day-1',
    name: 'Day 1 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day01_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-2',
    name: 'Day 2 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day02_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-3',
    name: 'Day 3 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day03_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-4',
    name: 'Day 4 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day04_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-5',
    name: 'Day 5 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day05_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-6',
    name: 'Day 6 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day06_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-7',
    name: 'Day 7 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day07_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-8',
    name: 'Day 8 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day08_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-9',
    name: 'Day 9 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day09_Morning_Chantings_Chanting_10day.mp3'),
  },
  {
    id: 'day-10',
    name: 'Day 10 Chantings',
    kind: PREDEFINED_KIND.DAY_CHANTING,
    prepTime: PREP_SECONDS,
    meditationTime: 60,
    audio: require('../../assets/audios/Day10_Morning_Chantings_Chanting_10day.mp3'),
  },
];

export function getPredefinedById(id) {
  if (id == null) return null;
  return PREDEFINED_MEDITATIONS.find((m) => m.id === id) ?? null;
}

export function computeAudioStartOffsetSec(kind, audioDurationSec) {
  if (kind === PREDEFINED_KIND.SHORT_INSTRUCTIONS) return 0;
  if (kind === PREDEFINED_KIND.DAY_CHANTING) {
    if (typeof audioDurationSec !== 'number' || audioDurationSec < 0) return 0;
    return Math.max(0, DAY_TOTAL_SECONDS - audioDurationSec);
  }
  return 0;
}

const _durationCacheMs = new Map();
const _inflight = new Map();

export async function getPredefinedAudioDurationMs(id) {
  if (_durationCacheMs.has(id)) return _durationCacheMs.get(id);
  if (_inflight.has(id)) return _inflight.get(id);
  const m = getPredefinedById(id);
  if (!m) return null;

  const promise = (async () => {
    const { Audio } = require('expo-av');
    let sound;
    try {
      const created = await Audio.Sound.createAsync(m.audio, { shouldPlay: false });
      sound = created.sound;
      let ms = created.status?.durationMillis ?? null;
      // Large files may not have durationMillis populated on the initial
      // status — fall back to a fresh status read.
      if (ms == null && typeof sound.getStatusAsync === 'function') {
        const fresh = await sound.getStatusAsync();
        ms = fresh?.durationMillis ?? null;
      }
      // expo-av sometimes reports isLoaded=true with durationMillis=null for
      // longer MP3s (notably on iOS) until the decoder has parsed the header.
      // Wait for a status update that carries a real duration, polling as a
      // nudge, with a timeout safety net.
      if (ms == null && typeof sound.setOnPlaybackStatusUpdate === 'function') {
        ms = await new Promise((resolve) => {
          let pollId;
          let timeoutId;
          let settled = false;
          const finish = (value) => {
            if (settled) return;
            settled = true;
            try { sound.setOnPlaybackStatusUpdate(null); } catch (_) {}
            if (pollId) clearInterval(pollId);
            if (timeoutId) clearTimeout(timeoutId);
            resolve(value);
          };
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status?.durationMillis != null) finish(status.durationMillis);
          });
          if (typeof sound.getStatusAsync === 'function') {
            pollId = setInterval(() => {
              sound.getStatusAsync().then((s) => {
                if (s?.durationMillis != null) finish(s.durationMillis);
              }).catch(() => {});
            }, 200);
          }
          timeoutId = setTimeout(() => finish(null), 5000);
        });
      }
      if (ms != null) _durationCacheMs.set(id, ms);
      return ms;
    } catch (e) {
      console.warn('failed to read audio duration:', id, e);
      return null;
    } finally {
      if (sound) {
        try { await sound.unloadAsync(); } catch (_) {}
      }
      _inflight.delete(id);
    }
  })();

  _inflight.set(id, promise);
  return promise;
}

export function _resetPredefinedAudioDurationCache() {
  _durationCacheMs.clear();
  _inflight.clear();
}

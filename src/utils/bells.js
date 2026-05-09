export const BELL_ASSETS = {
  Aguda: require('../../assets/bells/Aguda.wav'),
  Grave: require('../../assets/bells/Grave.wav'),
  Larga: require('../../assets/bells/Larga.mp3'),
  Media: require('../../assets/bells/Media.wav'),
  Suave: require('../../assets/bells/Suave.mp3'),
};

export const NONE_BELL = 'None';

export const BELL_NAMES = [...Object.keys(BELL_ASSETS), NONE_BELL];

export const DEFAULT_START_BELL = BELL_NAMES[0];
export const DEFAULT_END_BELL = BELL_NAMES[1] ?? BELL_NAMES[0];

export function resolveBellName(name) {
  if (name === NONE_BELL) return NONE_BELL;
  if (name && BELL_ASSETS[name]) return name;
  return DEFAULT_START_BELL;
}

export function getBellModule(name) {
  if (name === NONE_BELL) return null;
  return BELL_ASSETS[name] ?? null;
}

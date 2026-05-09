export const PREDEFINED_MEDITATIONS = [
  {
    id: 1,
    name: 'Morning Calm',
    prepTime: 60,
    meditationTime: 10,
    startBell: 'Aguda',
    endBell: 'Grave',
    description: 'Gentle start to your day',
  },
  {
    id: 2,
    name: 'Quick Reset',
    prepTime: 30,
    meditationTime: 5,
    startBell: 'Suave',
    endBell: 'Suave',
    description: 'Brief centering between tasks',
  },
  {
    id: 3,
    name: 'Deep Jhanna',
    prepTime: 120,
    meditationTime: 30,
    startBell: 'Grave',
    endBell: 'Larga',
    description: 'Extended absorption practice',
  },
  {
    id: 4,
    name: 'Body Scan',
    prepTime: 60,
    meditationTime: 15,
    startBell: 'Media',
    endBell: 'Grave',
    description: 'Full awareness through the body',
  },
  {
    id: 5,
    name: 'Loving Kindness',
    prepTime: 60,
    meditationTime: 20,
    startBell: 'Suave',
    endBell: 'Media',
    description: 'Metta practice',
  },
  {
    id: 6,
    name: 'Evening Wind-down',
    prepTime: 120,
    meditationTime: 20,
    startBell: 'Grave',
    endBell: 'Larga',
    description: 'Release the day',
  },
];

export function getPredefinedById(id) {
  if (id == null) return null;
  return PREDEFINED_MEDITATIONS.find((m) => m.id === id) ?? null;
}

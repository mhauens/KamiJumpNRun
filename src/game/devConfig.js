import { getLevels } from '../data/levelStore.js';

const START_LEVEL_ENV_KEY = 'VITE_START_LEVEL';

export function resolveStartLevelIndex() {
  if (!import.meta.env.DEV) {
    return 0;
  }

  const rawStartLevel = import.meta.env[START_LEVEL_ENV_KEY]?.trim();

  if (!rawStartLevel) {
    return 0;
  }

  const startLevel = Number(rawStartLevel);
  const matchingLevelIndex = getLevels().findIndex((level) => level.id === startLevel);

  if (!Number.isInteger(startLevel) || matchingLevelIndex === -1) {
    console.warn(
      `${START_LEVEL_ENV_KEY}="${rawStartLevel}" passt zu keinem Level. ` +
        'Starte stattdessen bei Level 1.',
    );

    return 0;
  }

  return matchingLevelIndex;
}

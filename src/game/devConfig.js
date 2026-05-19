import { getLevels } from '../data/levelStore.js';

const START_LEVEL_ENV_KEY = 'VITE_START_LEVEL';
const SHOW_PLATFORM_NUMBERS_ENV_KEY = 'VITE_SHOW_PLATFORM_NUMBERS';
const START_AT_BOSS_ENV_KEY = 'VITE_START_AT_BOSS';
const START_BOSS_DEFEATED_ENV_KEY = 'VITE_START_BOSS_DEFEATED';

function readDevBooleanEnv(key) {
  if (!import.meta.env.DEV) {
    return false;
  }

  const rawValue = import.meta.env[key]?.trim().toLowerCase();

  return rawValue === 'true' || rawValue === '1' || rawValue === 'yes' || rawValue === 'on';
}

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

export function shouldShowPlatformNumbers() {
  return readDevBooleanEnv(SHOW_PLATFORM_NUMBERS_ENV_KEY);
}

export function shouldStartAtBoss() {
  return readDevBooleanEnv(START_AT_BOSS_ENV_KEY);
}

export function shouldStartBossDefeated() {
  return readDevBooleanEnv(START_BOSS_DEFEATED_ENV_KEY);
}

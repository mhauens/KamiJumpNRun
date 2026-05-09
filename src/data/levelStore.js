import { LEVELS as initialLevels } from './levels.js';

let levels = initialLevels;
const listeners = new Set();

export function getLevels() {
  return levels;
}

export function getLevel(index) {
  return levels[index];
}

export function getLevelCount() {
  return levels.length;
}

export function subscribeLevelDataUpdates(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

if (import.meta.hot) {
  import.meta.hot.accept('./levels.js', (newModule) => {
    if (!newModule?.LEVELS) {
      return;
    }

    levels = newModule.LEVELS;
    listeners.forEach((listener) => listener(levels));
  });
}

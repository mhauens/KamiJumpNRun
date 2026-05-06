const bossSplashAudioUrls = import.meta.glob([
  '../../assets/boss_*/splashscreenSounds/*.ogg',
  '../../assets/boss_*/splashscreenSounds/*.mp3',
  '!../../assets/**/old/**',
  '!../../assets/**/OLD/**',
], {
  eager: true,
  import: 'default',
  query: '?url',
});

function createBossSplashAudioEntries(levelId, phase = 1) {
  const filesByClip = new Map();
  const pattern = new RegExp(
    `\\.\\./\\.\\./assets/boss_${levelId}/splashscreenSounds/boss_${levelId}_(\\d+)(_2)?\\.(ogg|mp3)$`,
  );

  Object.entries(bossSplashAudioUrls).forEach(([path, url]) => {
    const match = path.match(pattern);

    if (!match) {
      return;
    }

    const [, clipIndex, phaseTwoSuffix, extension] = match;
    const isPhaseTwoClip = phaseTwoSuffix === '_2';

    if ((phase === 2) !== isPhaseTwoClip) {
      return;
    }

    const urls = filesByClip.get(clipIndex) ?? {};
    urls[extension] = url;
    filesByClip.set(clipIndex, urls);
  });

  return Array.from(filesByClip.entries())
    .sort(([leftIndex], [rightIndex]) => Number(leftIndex) - Number(rightIndex))
    .map(([clipIndex, urls]) => ({
      key: phase === 2
        ? `boss-${levelId}-2-splash-audio-${clipIndex}`
        : `boss-${levelId}-splash-audio-${clipIndex}`,
      urls: [urls.ogg, urls.mp3].filter(Boolean),
    }))
    .filter((entry) => entry.urls.length > 0);
}

export const BOSS_SPLASH_AUDIO = Object.fromEntries(
  Array.from({ length: 6 }, (_, index) => {
    const levelId = index + 1;
    const phases = {
      1: createBossSplashAudioEntries(levelId, 1),
    };

    if (levelId === 6) {
      phases[2] = createBossSplashAudioEntries(levelId, 2);
    }

    return [levelId, phases];
  }),
);

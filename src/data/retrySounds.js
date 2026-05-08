const retrySoundUrls = import.meta.glob([
  '../../assets/shared/retrySounds/*.ogg',
  '../../assets/shared/retrySounds/*.mp3',
  '!../../assets/**/old/**',
  '!../../assets/**/OLD/**',
], {
  eager: true,
  import: 'default',
  query: '?url',
});

const MAX_RECENT_RETRY_SOUNDS = 6;
const recentRetrySoundKeys = [];

function createRetrySoundKey(fileBaseName) {
  return `retry-sound-${fileBaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

const retrySoundEntries = new Map();

Object.entries(retrySoundUrls).forEach(([path, url]) => {
  const match = path.match(/\.\.\/\.\.\/assets\/shared\/retrySounds\/(.+)\.(ogg|mp3)$/);

  if (!match) {
    return;
  }

  const [, fileBaseName, extension] = match;
  const urls = retrySoundEntries.get(fileBaseName) ?? {};
  urls[extension] = url;
  retrySoundEntries.set(fileBaseName, urls);
});

export const RETRY_SOUNDS = Array.from(retrySoundEntries.entries())
  .sort(([leftName], [rightName]) => leftName.localeCompare(rightName, 'de'))
  .map(([fileBaseName, urls]) => ({
    key: createRetrySoundKey(fileBaseName),
    urls: [urls.ogg, urls.mp3].filter(Boolean),
  }))
  .filter((entry) => entry.urls.length > 0);

export function getNextRetrySoundConfig() {
  if (RETRY_SOUNDS.length === 0) {
    return null;
  }

  const recentKeys = new Set(recentRetrySoundKeys);
  const playableSounds = RETRY_SOUNDS.filter((entry) => !recentKeys.has(entry.key));
  const soundPool = playableSounds.length > 0 ? playableSounds : RETRY_SOUNDS;
  const selectedIndex = Math.floor(Math.random() * soundPool.length);

  return soundPool[selectedIndex] ?? null;
}

export function rememberRetrySoundPlayback(key) {
  if (!key) {
    return;
  }

  recentRetrySoundKeys.push(key);

  while (recentRetrySoundKeys.length > MAX_RECENT_RETRY_SOUNDS) {
    recentRetrySoundKeys.shift();
  }
}

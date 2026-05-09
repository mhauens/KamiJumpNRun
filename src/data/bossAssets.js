const BOSS_LEVEL_COUNT = 6;

const assetUrls = import.meta.glob([
  '../../assets/boss_*/*.webp',
  '../../assets/boss_*/*.png',
  '!../../assets/**/old/**',
  '!../../assets/**/OLD/**',
], {
  eager: true,
  import: 'default',
  query: '?url',
});

function resolveAssetUrl(levelId, fileName) {
  return assetUrls[`../../assets/boss_${levelId}/${fileName}`] ??
    assetUrls[`../../assets/${fileName}`];
}

function resolveBossAsset(levelId, filePattern) {
  const fileName = filePattern(levelId);
  const fallbackFileName = filePattern(1);

  return resolveAssetUrl(levelId, fileName) ?? resolveAssetUrl(1, fallbackFileName);
}

function resolveOptionalBossAsset(levelId, fileBaseName) {
  return resolveAssetUrl(levelId, `${fileBaseName}.png`) ??
    resolveAssetUrl(levelId, `${fileBaseName}.webp`);
}

export const BOSS_ASSETS = Array.from({ length: BOSS_LEVEL_COUNT }, (_, index) => {
  const id = index + 1;
  const phase2 = id === 6
    ? {
        splashscreen: resolveAssetUrl(id, `boss_${id}_splashscreen_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_splashscreen.webp`),
        retrySplashscreen: resolveAssetUrl(id, `boss_${id}_retry_splashscreen_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_retry_splashscreen.webp`),
        stand: resolveAssetUrl(id, `boss_${id}_stand_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_stand.webp`),
        move: resolveAssetUrl(id, `boss_${id}_move_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_move.webp`),
        hit: resolveAssetUrl(id, `boss_${id}_hit_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_hit.webp`),
        attack: resolveAssetUrl(id, `boss_${id}_attack_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_attack.webp`),
        specialAttack: resolveAssetUrl(id, `boss_${id}_attack_2_special.webp`),
        defeated: resolveAssetUrl(id, `boss_${id}_defeated_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_defeated.webp`),
        shot: resolveAssetUrl(id, `boss_${id}_shot_2.webp`) ??
          resolveBossAsset(id, (levelId) => `boss_${levelId}_shot.webp`),
        specialShot: resolveAssetUrl(id, `boss_${id}_shot_2_special.webp`),
        puddle: resolveOptionalBossAsset(id, `boss_${id}_puddle_2`) ??
          resolveOptionalBossAsset(id, `boss_${id}_puddle`),
        charge: resolveOptionalBossAsset(id, `boss_${id}_charge_2`) ??
          resolveOptionalBossAsset(id, `mainChar_${id}_charge_2`) ??
          resolveOptionalBossAsset(id, `boss_${id}_charge`) ??
          resolveOptionalBossAsset(id, `mainChar_${id}_charge`),
        playerHit: resolveAssetUrl(id, `mainChar_${id}_hit_2.webp`) ??
          resolveBossAsset(id, (levelId) => `mainChar_${levelId}_hit.webp`),
      }
    : null;

  return {
    id,
    splashscreen: resolveBossAsset(id, (levelId) => `boss_${levelId}_splashscreen.webp`),
    retrySplashscreen: resolveBossAsset(id, (levelId) => `boss_${levelId}_retry_splashscreen.webp`),
    stand: resolveBossAsset(id, (levelId) => `boss_${levelId}_stand.webp`),
    move: resolveBossAsset(id, (levelId) => `boss_${levelId}_move.webp`),
    hit: resolveBossAsset(id, (levelId) => `boss_${levelId}_hit.webp`),
    attack: resolveBossAsset(id, (levelId) => `boss_${levelId}_attack.webp`),
    defeated: resolveBossAsset(id, (levelId) => `boss_${levelId}_defeated.webp`),
    shot: resolveBossAsset(id, (levelId) => `boss_${levelId}_shot.webp`),
    puddle: resolveOptionalBossAsset(id, `boss_${id}_puddle`),
    charge: resolveOptionalBossAsset(id, `boss_${id}_charge`) ??
      resolveOptionalBossAsset(id, `mainChar_${id}_charge`),
    playerHit: resolveBossAsset(id, (levelId) => `mainChar_${levelId}_hit.webp`),
    phase2,
  };
});

export function getBossAssets(levelId) {
  return BOSS_ASSETS.find((entry) => entry.id === levelId);
}

function loadImageIfNeeded(scene, key, url) {
  if (!url || scene.textures.exists(key)) {
    return;
  }

  scene.load.image(key, url);
}

export function loadBossAssetsForLevel(scene, levelId) {
  const asset = getBossAssets(levelId);

  if (!asset) {
    return;
  }

  loadImageIfNeeded(scene, `boss-${asset.id}-splashscreen`, asset.splashscreen);
  loadImageIfNeeded(scene, `boss-${asset.id}-retry-splashscreen`, asset.retrySplashscreen);
  loadImageIfNeeded(scene, `boss-${asset.id}-stand`, asset.stand);
  loadImageIfNeeded(scene, `boss-${asset.id}-move-source`, asset.move);
  loadImageIfNeeded(scene, `boss-${asset.id}-hit-source`, asset.hit);
  loadImageIfNeeded(scene, `boss-${asset.id}-attack-source`, asset.attack);
  loadImageIfNeeded(scene, `boss-${asset.id}-defeated`, asset.defeated);
  loadImageIfNeeded(scene, `boss-${asset.id}-shot`, asset.shot);
  loadImageIfNeeded(scene, `boss-${asset.id}-puddle`, asset.puddle);
  loadImageIfNeeded(scene, `boss-${asset.id}-charge-source`, asset.charge);
  loadImageIfNeeded(scene, `player-hit-boss-${asset.id}-source`, asset.playerHit);

  if (!asset.phase2) {
    return;
  }

  loadImageIfNeeded(scene, `boss-${asset.id}-2-splashscreen`, asset.phase2.splashscreen);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-retry-splashscreen`, asset.phase2.retrySplashscreen);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-stand`, asset.phase2.stand);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-move-source`, asset.phase2.move);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-hit-source`, asset.phase2.hit);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-attack-source`, asset.phase2.attack);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-attack-special-source`, asset.phase2.specialAttack);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-defeated`, asset.phase2.defeated);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-shot`, asset.phase2.shot);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-shot-special`, asset.phase2.specialShot);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-puddle`, asset.phase2.puddle);
  loadImageIfNeeded(scene, `boss-${asset.id}-2-charge-source`, asset.phase2.charge);
  loadImageIfNeeded(scene, `player-hit-boss-${asset.id}-2-source`, asset.phase2.playerHit);
}

export function getBossRuntimeAtlasKeys(levelId) {
  const asset = getBossAssets(levelId);

  if (!asset) {
    return [];
  }

  return [
    `boss-${asset.id}-stand`,
    `boss-${asset.id}-defeated`,
    `boss-${asset.id}-shot`,
    `boss-${asset.id}-puddle`,
    ...(asset.phase2
      ? [
          `boss-${asset.id}-2-stand`,
          `boss-${asset.id}-2-defeated`,
          `boss-${asset.id}-2-shot`,
          `boss-${asset.id}-2-shot-special`,
          `boss-${asset.id}-2-puddle`,
        ]
      : []),
  ];
}

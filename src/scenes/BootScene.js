import Phaser from 'phaser';
import mainCharStandUrl from '../../assets/mainChar/mainChar_stand.webp';
import mainCharJumpUrl from '../../assets/mainChar/mainChar_jump.webp';
import mainCharWalkUrl from '../../assets/mainChar/mainChar_walk.webp';
import backgroundUrl from '../../assets/backgrounds/background.webp';
import bridgeHillsBackgroundUrl from '../../assets/backgrounds/bridge_hills_background.webp';
import skyRouteBackgroundUrl from '../../assets/backgrounds/sky_route_background.webp';
import cloudGardenBackgroundUrl from '../../assets/backgrounds/cloud_garden_background.webp';
import championRidgeBackgroundUrl from '../../assets/backgrounds/champion_ridge_background.webp';
import riverStepsBackgroundUrl from '../../assets/backgrounds/river_steps_background.webp';
import groundPlatformUrl from '../../assets/shared/ground_platform.webp';
import levelTemplateUrl from '../../assets/shared/level_template.webp';
import startScreenUrl from '../../assets/shared/start_screen.webp';
import { LEVELS } from '../data/levels.js';

const WALK_FRAME_VISUAL_SCALE = 0.72;
const WALK_FRAME_VERTICAL_OFFSET = 230;
const SHEET_COLUMNS = 4;
const SHEET_ROWS = 2;
const BOSS_FRAME_GUTTER = 10;
const BOSS_FRAME_PADDING = 8;
const WIDE_ATTACK_FRAME_OVERFLOW = 80;
const BOSS_4_HIT_FRAME_OVERFLOW = 24;
const BOSS_SIGNIFICANT_COMPONENT_RATIO = 0.06;
const HIT_ANIMATION_FRAME_RATE = 8;
const ATTACK_ANIMATION_FRAME_RATE = 6;
const BOSS_LEVEL_COUNT = 6;
const assetUrls = import.meta.glob([
  '../../assets/**/*.webp',
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

const BOSS_ASSETS = Array.from({ length: BOSS_LEVEL_COUNT }, (_, index) => {
  const id = index + 1;

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
    playerHit: resolveBossAsset(id, (levelId) => `mainChar_${levelId}_hit.webp`),
  };
});

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('char-stand', mainCharStandUrl);
    this.load.image('char-jump', mainCharJumpUrl);
    this.load.image('char-walk-source', mainCharWalkUrl);
    this.load.image('background', backgroundUrl);
    this.load.image('background-bridge-hills', bridgeHillsBackgroundUrl);
    this.load.image('background-sky-route', skyRouteBackgroundUrl);
    this.load.image('background-cloud-garden', cloudGardenBackgroundUrl);
    this.load.image('background-champion-ridge', championRidgeBackgroundUrl);
    this.load.image('background-river-steps', riverStepsBackgroundUrl);
    this.load.image('ground-platform-source', groundPlatformUrl);
    this.load.image('level-template', levelTemplateUrl);
    this.load.image('start-screen', startScreenUrl);
    this.loadBossAssets();
    this.loadBossAudio();

    this.createLoadingLabel();
  }

  create() {
    this.configureSplashscreenTextures();
    this.createCharacterWalkTextures();
    this.createGeneratedTextures();

    this.scene.start('StartScene');
  }

  loadBossAssets() {
    BOSS_ASSETS.forEach((asset) => {
      this.load.image(`boss-${asset.id}-splashscreen`, asset.splashscreen);
      this.load.image(`boss-${asset.id}-retry-splashscreen`, asset.retrySplashscreen);
      this.load.image(`boss-${asset.id}-stand`, asset.stand);
      this.load.image(`boss-${asset.id}-move-source`, asset.move);
      this.load.image(`boss-${asset.id}-hit-source`, asset.hit);
      this.load.image(`boss-${asset.id}-attack-source`, asset.attack);
      this.load.image(`boss-${asset.id}-defeated`, asset.defeated);
      this.load.image(`boss-${asset.id}-shot`, asset.shot);
      this.load.image(`player-hit-boss-${asset.id}-source`, asset.playerHit);
    });
  }

  loadBossAudio() {
    LEVELS.forEach((level) => {
      [level.boss?.audio?.splash, level.boss?.audio?.retrySplash].forEach((config) => {
        if (!config?.key || !Array.isArray(config.urls) || config.urls.length === 0) {
          return;
        }

        this.load.audio(config.key, config.urls);
      });
    });
  }

  configureSplashscreenTextures() {
    BOSS_ASSETS.forEach((asset) => {
      this.textures
        .get(`boss-${asset.id}-splashscreen`)
        .setFilter(Phaser.Textures.FilterMode.LINEAR);

      this.textures
        .get(`boss-${asset.id}-retry-splashscreen`)
        .setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
  }

  createLoadingLabel() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const label = this.add
      .text(centerX, centerY, 'Lade Kami\'s World...', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '28px',
        color: '#17324d',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.load.on('progress', (value) => {
      label.setText(`Lade Kami's World... ${Math.round(value * 100)}%`);
    });
  }

  createCharacterWalkTextures() {
    const sourceImage = this.textures.get('char-walk-source').getSourceImage();
    const targetImage = this.textures.get('char-stand').getSourceImage();
    const columns = 4;
    const rows = 2;
    const frameWidth = Math.floor(sourceImage.width / columns);
    const frameHeight = Math.floor(sourceImage.height / rows);
    const gutter = 3;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const frameIndex = row * columns + column + 1;
        const isLastColumn = column === columns - 1;
        const isLastRow = row === rows - 1;

        this.createCharacterWalkFrame({
          sourceImage,
          targetImage,
          sourceX: column * frameWidth + gutter,
          sourceY: row * frameHeight + gutter,
          sourceWidth: (isLastColumn
            ? sourceImage.width - column * frameWidth
            : frameWidth) - gutter * 2,
          sourceHeight: (isLastRow
            ? sourceImage.height - row * frameHeight
            : frameHeight) - gutter * 2,
          targetKey: `char-walk-${frameIndex}`,
        });
      }
    }
  }

  createCharacterWalkFrame({
    sourceImage,
    targetImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    targetKey,
  }) {
    if (this.textures.exists(targetKey)) {
      return;
    }

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = sourceWidth;
    sourceCanvas.height = sourceHeight;

    const sourceContext = sourceCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    sourceContext.imageSmoothingEnabled = false;
    sourceContext.drawImage(
      sourceImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );

    const frameData = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight);
    const pixels = frameData.data;
    let minX = sourceWidth;
    let minY = sourceHeight;
    let maxX = 0;
    let maxY = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const pixelIndex = index / 4;
      const x = pixelIndex % sourceWidth;
      const y = Math.floor(pixelIndex / sourceWidth);
      const isWhiteBackground = red > 245 && green > 245 && blue > 245;

      if (alpha > 0 && isWhiteBackground) {
        pixels[index + 3] = 0;
        continue;
      }

      if (pixels[index + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    sourceContext.putImageData(frameData, 0, 0);

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const scale = (targetImage.height * WALK_FRAME_VISUAL_SCALE) / cropHeight;
    const drawWidth = cropWidth * scale;
    const drawHeight = cropHeight * scale;
    const canvas = document.createElement('canvas');
    canvas.width = targetImage.width;
    canvas.height = targetImage.height;

    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sourceCanvas,
      minX,
      minY,
      cropWidth,
      cropHeight,
      (canvas.width - drawWidth) / 2,
      canvas.height - drawHeight - WALK_FRAME_VERTICAL_OFFSET,
      drawWidth,
      drawHeight,
    );

    this.textures.addCanvas(targetKey, canvas);
  }

  createBossAnimations(levelId) {
    const asset = BOSS_ASSETS.find((entry) => entry.id === levelId);

    if (!asset || this.anims.exists(`boss-${asset.id}-move`)) {
      return;
    }

    const bossLayout = this.createBossFrameLayout(asset.id, [
      `boss-${asset.id}-move-source`,
      `boss-${asset.id}-hit-source`,
      `boss-${asset.id}-attack-source`,
    ]);

    this.createBossFrames(`boss-${asset.id}-move-source`, `boss-${asset.id}-move-frame`, bossLayout);
    this.createBossFrames(`boss-${asset.id}-hit-source`, `boss-${asset.id}-hit-frame`, bossLayout);
    this.createBossFrames(`boss-${asset.id}-attack-source`, `boss-${asset.id}-attack-frame`, bossLayout);
    this.createPlayerHitFrames(
      `player-hit-boss-${asset.id}-source`,
      `player-hit-boss-${asset.id}-frame`,
    );

    this.createAnimation(`boss-${asset.id}-move`, `boss-${asset.id}-move-frame`, 8, -1);
    this.createAnimation(
      `boss-${asset.id}-hit`,
      `boss-${asset.id}-hit-frame`,
      HIT_ANIMATION_FRAME_RATE,
      0,
    );
    this.createAnimation(
      `boss-${asset.id}-attack`,
      `boss-${asset.id}-attack-frame`,
      ATTACK_ANIMATION_FRAME_RATE,
      0,
    );
    this.createAnimation(
      `player-hit-boss-${asset.id}`,
      `player-hit-boss-${asset.id}-frame`,
      HIT_ANIMATION_FRAME_RATE,
      0,
    );
  }

  createSheetFrames(sourceKey, framePrefix) {
    const sourceImage = this.textures.get(sourceKey).getSourceImage();
    const frameWidth = Math.floor(sourceImage.width / SHEET_COLUMNS);
    const frameHeight = Math.floor(sourceImage.height / SHEET_ROWS);
    const croppedFrameWidth = frameWidth - BOSS_FRAME_GUTTER * 2;
    const croppedFrameHeight = frameHeight - BOSS_FRAME_GUTTER * 2;

    for (let row = 0; row < SHEET_ROWS; row += 1) {
      for (let column = 0; column < SHEET_COLUMNS; column += 1) {
        const frameIndex = row * SHEET_COLUMNS + column + 1;
        const targetKey = `${framePrefix}-${frameIndex}`;

        if (this.textures.exists(targetKey)) {
          continue;
        }

        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.imageSmoothingEnabled = false;
        context.drawImage(
          sourceImage,
          column * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight,
          0,
          0,
          frameWidth,
          frameHeight,
        );

        this.clearWhiteBackground(context, frameWidth, frameHeight);
        this.textures.addCanvas(targetKey, canvas);
      }
    }
  }

  createBossFrameLayout(bossId, sourceKeys) {
    const targetImage = this.textures.get(`boss-${bossId}-stand`).getSourceImage();
    const targetBounds = this.getVisibleBounds(targetImage);
    const frameBoundsBySource = Object.fromEntries(
      sourceKeys.map((sourceKey) => [sourceKey, this.getBossSheetFrameBounds(sourceKey)]),
    );
    const frameBounds = Object.values(frameBoundsBySource).flat();
    const maxDrawWidth = Math.max(
      targetBounds.width,
      ...frameBounds.map((bounds) => bounds.width * (targetBounds.height / bounds.height)),
    );
    const canvasWidth = Math.ceil(maxDrawWidth + BOSS_FRAME_PADDING * 2);
    const canvasHeight = Math.ceil(targetBounds.height + BOSS_FRAME_PADDING * 2);
    const centerX = canvasWidth / 2;
    const baselineY = canvasHeight - BOSS_FRAME_PADDING;

    return {
      bossId,
      canvasWidth,
      canvasHeight,
      centerX,
      baselineY,
      targetHeight: targetBounds.height,
      frameBoundsBySource,
    };
  }

  getBossSheetFrameBounds(sourceKey) {
    const sourceImage = this.textures.get(sourceKey).getSourceImage();
    const bounds = [];

    for (let row = 0; row < SHEET_ROWS; row += 1) {
      for (let column = 0; column < SHEET_COLUMNS; column += 1) {
        const frameRect = this.getBossSheetFrameRect(sourceImage, column, row, sourceKey);
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = frameRect.width;
        sourceCanvas.height = frameRect.height;

        const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
        sourceContext.imageSmoothingEnabled = false;
        sourceContext.drawImage(
          sourceImage,
          frameRect.x,
          frameRect.y,
          frameRect.width,
          frameRect.height,
          0,
          0,
          frameRect.width,
          frameRect.height,
        );

        this.clearEdgeWhiteBackground(sourceContext, frameRect.width, frameRect.height);
        const sourceBounds = this.getSignificantVisibleBounds(sourceCanvas, true);
        bounds.push(sourceBounds);
      }
    }

    return bounds;
  }

  createBossFrames(sourceKey, framePrefix, layout) {
    const sourceImage = this.textures.get(sourceKey).getSourceImage();

    for (let row = 0; row < SHEET_ROWS; row += 1) {
      for (let column = 0; column < SHEET_COLUMNS; column += 1) {
        const frameIndex = row * SHEET_COLUMNS + column + 1;
        const targetKey = `${framePrefix}-${frameIndex}`;
        const frameRect = this.getBossSheetFrameRect(sourceImage, column, row, sourceKey);

        if (this.textures.exists(targetKey)) {
          continue;
        }

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = frameRect.width;
        sourceCanvas.height = frameRect.height;

        const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
        sourceContext.imageSmoothingEnabled = false;
        sourceContext.drawImage(
          sourceImage,
          frameRect.x,
          frameRect.y,
          frameRect.width,
          frameRect.height,
          0,
          0,
          frameRect.width,
          frameRect.height,
        );

        this.clearEdgeWhiteBackground(sourceContext, frameRect.width, frameRect.height);
        const sourceBounds = this.getSignificantVisibleBounds(sourceCanvas, true);

        const canvas = document.createElement('canvas');
        canvas.width = layout.canvasWidth;
        canvas.height = layout.canvasHeight;

        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        const scale = this.getBossFrameScale(sourceKey, sourceBounds, layout);
        const drawWidth = sourceBounds.width * scale;
        const drawHeight = sourceBounds.height * scale;
        const drawX = layout.centerX - drawWidth / 2;
        const drawY = layout.baselineY - drawHeight;

        context.drawImage(
          sourceCanvas,
          sourceBounds.x,
          sourceBounds.y,
          sourceBounds.width,
          sourceBounds.height,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        );

        this.textures.addCanvas(targetKey, canvas);
      }
    }
  }

  getBossSheetFrameRect(image, column, row, sourceKey) {
    const frameRect = this.getSheetFrameRect(image, column, row);
    const useWideAttackFrame = sourceKey === 'boss-2-attack-source' ||
      sourceKey === 'boss-3-attack-source' ||
      sourceKey === 'boss-4-attack-source';
    const gutter = useWideAttackFrame ? 0 : BOSS_FRAME_GUTTER;
    const horizontalGutter = sourceKey === 'boss-4-move-source' ||
      sourceKey === 'boss-4-hit-source'
      ? 0
      : gutter;
    const bottomGutter = sourceKey === 'boss-4-move-source' ? 0 : gutter;
    const overflow = useWideAttackFrame
      ? WIDE_ATTACK_FRAME_OVERFLOW
      : sourceKey === 'boss-4-hit-source'
        ? BOSS_4_HIT_FRAME_OVERFLOW
        : 0;
    const x = Math.max(0, frameRect.x + horizontalGutter - overflow);
    const y = frameRect.y + gutter;
    const right = Math.min(image.width, frameRect.x + frameRect.width - horizontalGutter + overflow);
    const bottom = frameRect.y + frameRect.height - bottomGutter;

    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y),
    };
  }

  getBossFrameScale(sourceKey, sourceBounds, layout) {
    if (sourceKey === 'boss-4-attack-source') {
      const attackFrameBounds = layout.frameBoundsBySource[sourceKey] ?? [];
      const attackReferenceHeight = Math.max(
        sourceBounds.height,
        ...attackFrameBounds.map((bounds) => bounds.height),
      );

      return layout.targetHeight / attackReferenceHeight;
    }

    return layout.targetHeight / sourceBounds.height;
  }

  getVisibleBounds(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const isWhiteBackground = red > 245 && green > 245 && blue > 245;

      if (alpha <= 0 || isWhiteBackground) {
        continue;
      }

      const pixelIndex = index / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (minX > maxX || minY > maxY) {
      return { x: 0, y: 0, width: canvas.width, height: canvas.height };
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  getSignificantVisibleBounds(image, useAlphaOnly = false) {
    const components = this.getVisibleComponents(image, useAlphaOnly);

    if (components.length === 0) {
      return { x: 0, y: 0, width: image.width, height: image.height };
    }

    const largestPixelCount = components[0].pixelCount;
    const significantComponents = components.filter(
      (component, index) => index === 0 ||
        (
          component.pixelCount >= largestPixelCount * BOSS_SIGNIFICANT_COMPONENT_RATIO &&
          !component.touchesEdge
        ),
    );
    const componentsToUse = significantComponents.length > 0
      ? significantComponents
      : [components[0]];

    const minX = Math.min(...componentsToUse.map((component) => component.x));
    const minY = Math.min(...componentsToUse.map((component) => component.y));
    const maxX = Math.max(
      ...componentsToUse.map((component) => component.x + component.width - 1),
    );
    const maxY = Math.max(
      ...componentsToUse.map((component) => component.y + component.height - 1),
    );

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  getVisibleComponents(image, useAlphaOnly = false) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const visited = new Uint8Array(canvas.width * canvas.height);
    const components = [];
    const stack = [];

    const isVisiblePixel = (pixelIndex) => {
      const dataIndex = pixelIndex * 4;
      const red = pixels[dataIndex];
      const green = pixels[dataIndex + 1];
      const blue = pixels[dataIndex + 2];
      const alpha = pixels[dataIndex + 3];
      const isWhiteBackground = red > 245 && green > 245 && blue > 245;

      return alpha > 0 && (useAlphaOnly || !isWhiteBackground);
    };

    for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
      if (visited[pixelIndex] || !isVisiblePixel(pixelIndex)) {
        continue;
      }

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let pixelCount = 0;

      visited[pixelIndex] = 1;
      stack.push(pixelIndex);

      while (stack.length > 0) {
        const currentIndex = stack.pop();
        const x = currentIndex % canvas.width;
        const y = Math.floor(currentIndex / canvas.width);

        pixelCount += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        const neighborIndexes = [
          x > 0 ? currentIndex - 1 : -1,
          x < canvas.width - 1 ? currentIndex + 1 : -1,
          y > 0 ? currentIndex - canvas.width : -1,
          y < canvas.height - 1 ? currentIndex + canvas.width : -1,
        ];

        neighborIndexes.forEach((neighborIndex) => {
          if (
            neighborIndex === -1 ||
            visited[neighborIndex] ||
            !isVisiblePixel(neighborIndex)
          ) {
            return;
          }

          visited[neighborIndex] = 1;
          stack.push(neighborIndex);
        });
      }

      components.push({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        pixelCount,
        touchesEdge: minX === 0 ||
          minY === 0 ||
          maxX === canvas.width - 1 ||
          maxY === canvas.height - 1,
      });
    }

    return components.sort((a, b) => b.pixelCount - a.pixelCount);
  }

  getSheetFrameRect(image, column, row) {
    const x = Math.round((image.width * column) / SHEET_COLUMNS);
    const nextX = Math.round((image.width * (column + 1)) / SHEET_COLUMNS);
    const y = Math.round((image.height * row) / SHEET_ROWS);
    const nextY = Math.round((image.height * (row + 1)) / SHEET_ROWS);

    return {
      x,
      y,
      width: nextX - x,
      height: nextY - y,
    };
  }

  createPlayerHitFrames(sourceKey, framePrefix) {
    const sourceImage = this.textures.get(sourceKey).getSourceImage();
    const targetImage = this.textures.get('char-stand').getSourceImage();
    const targetBounds = this.getVisibleBounds(targetImage);

    for (let row = 0; row < SHEET_ROWS; row += 1) {
      for (let column = 0; column < SHEET_COLUMNS; column += 1) {
        const frameIndex = row * SHEET_COLUMNS + column + 1;
        const targetKey = `${framePrefix}-${frameIndex}`;
        const frameRect = this.getSheetFrameRect(sourceImage, column, row);

        if (this.textures.exists(targetKey)) {
          continue;
        }

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = frameRect.width;
        sourceCanvas.height = frameRect.height;

        const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
        sourceContext.imageSmoothingEnabled = false;
        sourceContext.drawImage(
          sourceImage,
          frameRect.x,
          frameRect.y,
          frameRect.width,
          frameRect.height,
          0,
          0,
          frameRect.width,
          frameRect.height,
        );

        this.clearWhiteBackground(sourceContext, frameRect.width, frameRect.height);
        const sourceBounds = this.getVisibleBounds(sourceCanvas);

        const canvas = document.createElement('canvas');
        canvas.width = targetImage.width;
        canvas.height = targetImage.height;

        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        const scale = targetBounds.height / sourceBounds.height;
        const drawWidth = sourceBounds.width * scale;
        const drawHeight = sourceBounds.height * scale;
        const drawX = targetBounds.x + (targetBounds.width - drawWidth) / 2;
        const drawY = targetBounds.y + targetBounds.height - drawHeight;

        context.drawImage(
          sourceCanvas,
          sourceBounds.x,
          sourceBounds.y,
          sourceBounds.width,
          sourceBounds.height,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        );

        this.textures.addCanvas(targetKey, canvas);
      }
    }
  }

  clearWhiteBackground(context, width, height) {
    const frameData = context.getImageData(0, 0, width, height);
    const pixels = frameData.data;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];

      if (alpha > 0 && red > 245 && green > 245 && blue > 245) {
        pixels[index + 3] = 0;
      }
    }

    context.putImageData(frameData, 0, 0);
  }

  clearEdgeWhiteBackground(context, width, height) {
    const frameData = context.getImageData(0, 0, width, height);
    const pixels = frameData.data;
    const visited = new Uint8Array(width * height);
    const stack = [];

    const isWhitePixel = (pixelIndex) => {
      const dataIndex = pixelIndex * 4;
      return pixels[dataIndex + 3] > 0 &&
        pixels[dataIndex] > 245 &&
        pixels[dataIndex + 1] > 245 &&
        pixels[dataIndex + 2] > 245;
    };

    const visit = (pixelIndex) => {
      if (visited[pixelIndex] || !isWhitePixel(pixelIndex)) {
        return;
      }

      visited[pixelIndex] = 1;
      stack.push(pixelIndex);
    };

    for (let x = 0; x < width; x += 1) {
      visit(x);
      visit((height - 1) * width + x);
    }

    for (let y = 0; y < height; y += 1) {
      visit(y * width);
      visit(y * width + width - 1);
    }

    while (stack.length > 0) {
      const pixelIndex = stack.pop();
      const dataIndex = pixelIndex * 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      pixels[dataIndex + 3] = 0;

      if (x > 0) {
        visit(pixelIndex - 1);
      }

      if (x < width - 1) {
        visit(pixelIndex + 1);
      }

      if (y > 0) {
        visit(pixelIndex - width);
      }

      if (y < height - 1) {
        visit(pixelIndex + width);
      }
    }

    context.putImageData(frameData, 0, 0);
  }

  createAnimation(key, framePrefix, frameRate, repeat) {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: Array.from({ length: SHEET_COLUMNS * SHEET_ROWS }, (_, index) => ({
        key: `${framePrefix}-${index + 1}`,
      })),
      frameRate,
      repeat,
    });
  }

  createGeneratedTextures() {
    this.createPlatformTexture();
    this.createCoinTexture();
    this.createBallTexture();
    this.createCheckpointTexture();
    this.createGoalTexture();
    this.createBossProjectileTexture();
  }

  createPlatformTexture() {
    if (this.textures.exists('platform-block')) {
      return;
    }

    const sourceImage = this.textures.get('ground-platform-source').getSourceImage();
    const strip = {
      x: 246,
      y: 598,
      width: 1044,
      height: 112,
    };

    this.createCroppedPlatformTexture('platform-surface', sourceImage, {
      ...strip,
      targetWidth: 256,
      targetHeight: 72,
    });
    this.createCroppedPlatformTexture('platform-dirt', sourceImage, {
      x: strip.x,
      y: strip.y + 62,
      width: strip.width,
      height: 48,
      targetWidth: 256,
      targetHeight: 64,
    });

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture('platform-hitbox', 8, 8);
    graphics.destroy();
  }

  createCroppedPlatformTexture(targetKey, sourceImage, crop) {
    if (this.textures.exists(targetKey)) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = crop.targetWidth;
    canvas.height = crop.targetHeight;

    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sourceImage,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    this.textures.addCanvas(targetKey, canvas);
  }

  createCoinTexture() {
    if (this.textures.exists('coin')) {
      return;
    }

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffdf4d, 1);
    graphics.fillCircle(16, 16, 15);
    graphics.fillStyle(0xfff3a2, 1);
    graphics.fillCircle(12, 12, 5);
    graphics.lineStyle(3, 0xd99b00, 1);
    graphics.strokeCircle(16, 16, 13);
    graphics.generateTexture('coin', 32, 32);
    graphics.destroy();
  }

  createBallTexture() {
    if (this.textures.exists('ball')) {
      return;
    }

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(20, 20, 18);
    graphics.fillStyle(0xe34d4d, 1);
    graphics.fillCircle(20, 14, 16);
    graphics.fillStyle(0x101820, 1);
    graphics.fillRect(4, 18, 32, 4);
    graphics.fillCircle(20, 20, 6);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(20, 20, 3);
    graphics.lineStyle(3, 0x101820, 1);
    graphics.strokeCircle(20, 20, 18);
    graphics.generateTexture('ball', 40, 40);
    graphics.destroy();
  }

  createCheckpointTexture() {
    if (this.textures.exists('checkpoint')) {
      return;
    }

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0x805a38, 1);
    graphics.fillRect(12, 0, 6, 56);
    graphics.fillStyle(0xff755d, 1);
    graphics.fillTriangle(18, 6, 46, 16, 18, 26);
    graphics.fillStyle(0xffe4a1, 1);
    graphics.fillRect(18, 12, 10, 8);
    graphics.generateTexture('checkpoint', 52, 56);
    graphics.destroy();
  }

  createGoalTexture() {
    if (this.textures.exists('goal')) {
      return;
    }

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0x6a4d2f, 1);
    graphics.fillRect(12, 0, 6, 72);
    graphics.fillStyle(0x58d27f, 1);
    graphics.fillRoundedRect(18, 6, 34, 24, 6);
    graphics.fillStyle(0xeffff0, 1);
    graphics.fillRect(24, 12, 22, 4);
    graphics.fillRect(24, 20, 14, 4);
    graphics.generateTexture('goal', 56, 72);
    graphics.destroy();
  }

  createBossProjectileTexture() {
    if (this.textures.exists('boss-projectile')) {
      return;
    }

    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xfff1a8, 1);
    graphics.fillRoundedRect(0, 7, 34, 12, 6);
    graphics.fillStyle(0xff7b35, 1);
    graphics.fillRoundedRect(18, 4, 20, 18, 8);
    graphics.lineStyle(2, 0x8f2f18, 1);
    graphics.strokeRoundedRect(0, 7, 36, 12, 6);
    graphics.generateTexture('boss-projectile', 40, 26);
    graphics.destroy();
  }
}

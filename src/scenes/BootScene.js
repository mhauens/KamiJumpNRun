import Phaser from 'phaser';
import introMusicMp3Url from '../../assets/shared/KamisWorldIntro.mp3';
import introMusicOggUrl from '../../assets/shared/KamisWorldIntro.ogg';
import mainCharStandUrl from '../../assets/mainChar/mainChar_stand.webp';
import mainCharJumpUrl from '../../assets/mainChar/mainChar_jump.webp';
import mainCharWalkUrl from '../../assets/mainChar/mainChar_walk.webp';
import backgroundUrl from '../../assets/backgrounds/background.webp';
import artCityBackgroundUrl from '../../assets/backgrounds/art_city_background.webp';
import candyTownBackgroundUrl from '../../assets/backgrounds/candy_town_background.webp';
import cardCityBackgroundUrl from '../../assets/backgrounds/card_city_background.webp';
import horsesBackgroundUrl from '../../assets/backgrounds/horses_background.webp';
import championRidgeBackgroundUrl from '../../assets/backgrounds/champion_ridge_background.webp';
import shishaCityBackgroundUrl from '../../assets/backgrounds/shisha_city_background.webp';
import critHitUrl from '../../assets/shared/crit_hit.webp';
import groundPlatformUrl from '../../assets/shared/ground_platform.webp';
import levelTemplateUrl from '../../assets/shared/level_template.webp';
import startScreenUrl from '../../assets/shared/start_screen.webp';
import { BOSS_ASSETS } from '../data/bossAssets.js';
import { RETRY_SOUNDS } from '../data/retrySounds.js';
import { createRuntimeSpriteAtlas } from '../game/spriteAtlas.js';

const WALK_FRAME_VISUAL_SCALE = 0.72;
const WALK_FRAME_VERTICAL_OFFSET = 210;
const SHEET_COLUMNS = 4;
const SHEET_ROWS = 2;
const BOSS_FRAME_GUTTER = 10;
const BOSS_FRAME_PADDING = 8;
const WIDE_ATTACK_FRAME_OVERFLOW = 80;
const BOSS_4_HIT_FRAME_OVERFLOW = 24;
const BOSS_SIGNIFICANT_COMPONENT_RATIO = 0.06;
const HIT_ANIMATION_FRAME_RATE = 8;
const ATTACK_ANIMATION_FRAME_RATE = 6;
const PLAYER_HIT_FIT_WIDTH_SOURCE_KEYS = new Set([
  'player-hit-boss-6-source',
  'player-hit-boss-6-2-source',
]);
const PLAYER_HIT_WIDE_FRAME_SCALE_MULTIPLIER = 1.06;
const INTRO_MUSIC_KEY = 'kamis-world-intro';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('char-stand', mainCharStandUrl);
    this.load.image('char-jump', mainCharJumpUrl);
    this.load.image('char-walk-source', mainCharWalkUrl);
    this.load.image('background', backgroundUrl);
    this.load.image('background-art-city', artCityBackgroundUrl);
    this.load.image('background-candy-town', candyTownBackgroundUrl);
    this.load.image('background-card-city', cardCityBackgroundUrl);
    this.load.image('background-horses', horsesBackgroundUrl);
    this.load.image('background-champion-ridge', championRidgeBackgroundUrl);
    this.load.image('background-shisha-city', shishaCityBackgroundUrl);
    this.load.image('ground-platform-source', groundPlatformUrl);
    this.load.image('level-template', levelTemplateUrl);
    this.load.image('start-screen', startScreenUrl);
    this.load.image('crit-hit', critHitUrl);
    this.load.audio(INTRO_MUSIC_KEY, [introMusicOggUrl, introMusicMp3Url]);
    this.loadRetryAudio();

    this.createLoadingLabel();
  }

  create() {
    this.createCharacterWalkTextures();
    this.createGeneratedTextures();
    this.createRuntimeAtlas();

    this.scene.start('StartScene');
  }

  loadRetryAudio() {
    RETRY_SOUNDS.forEach((config) => {
      this.load.audio(config.key, config.urls);
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

  createBossAnimations(levelId, phase = 1) {
    const asset = BOSS_ASSETS.find((entry) => entry.id === levelId);
    const phaseAsset = phase === 2 ? asset?.phase2 : asset;
    const keyPrefix = phase === 2 ? `boss-${levelId}-2` : `boss-${levelId}`;
    const playerHitPrefix = phase === 2 ? `player-hit-boss-${levelId}-2` : `player-hit-boss-${levelId}`;

    if (!asset || !phaseAsset || this.anims.exists(`${keyPrefix}-move`)) {
      return;
    }

    const sourceKeys = [
      `${keyPrefix}-move-source`,
      `${keyPrefix}-hit-source`,
      `${keyPrefix}-attack-source`,
    ];

    if (phaseAsset.charge) {
      sourceKeys.push(`${keyPrefix}-charge-source`);
    }
    if (phaseAsset.specialAttack) {
      sourceKeys.push(`${keyPrefix}-attack-special-source`);
    }

    const bossLayout = this.createBossFrameLayout(levelId, `${keyPrefix}-stand`, sourceKeys);

    this.createBossFrames(`${keyPrefix}-move-source`, `${keyPrefix}-move-frame`, bossLayout);
    this.createBossFrames(`${keyPrefix}-hit-source`, `${keyPrefix}-hit-frame`, bossLayout);
    this.createBossFrames(`${keyPrefix}-attack-source`, `${keyPrefix}-attack-frame`, bossLayout);
    if (phaseAsset.charge) {
      this.createBossFrames(`${keyPrefix}-charge-source`, `${keyPrefix}-charge-frame`, bossLayout);
    }
    if (phaseAsset.specialAttack) {
      this.createBossFrames(`${keyPrefix}-attack-special-source`, `${keyPrefix}-attack-special-frame`, bossLayout);
    }
    this.createPlayerHitFrames(
      `${playerHitPrefix}-source`,
      `${playerHitPrefix}-frame`,
    );

    this.createAnimation(`${keyPrefix}-move`, `${keyPrefix}-move-frame`, 8, -1);
    this.createAnimation(
      `${keyPrefix}-hit`,
      `${keyPrefix}-hit-frame`,
      HIT_ANIMATION_FRAME_RATE,
      0,
    );
    this.createAnimation(
      `${keyPrefix}-attack`,
      `${keyPrefix}-attack-frame`,
      ATTACK_ANIMATION_FRAME_RATE,
      0,
    );
    if (phaseAsset.charge) {
      this.createAnimation(`${keyPrefix}-charge`, `${keyPrefix}-charge-frame`, 12, -1);
    }
    if (phaseAsset.specialAttack) {
      this.createAnimation(
        `${keyPrefix}-attack-special`,
        `${keyPrefix}-attack-special-frame`,
        ATTACK_ANIMATION_FRAME_RATE,
        0,
      );
    }
    this.createAnimation(
      playerHitPrefix,
      `${playerHitPrefix}-frame`,
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

  createBossFrameLayout(bossId, standKey, sourceKeys) {
    const targetImage = this.textures.get(standKey).getSourceImage();
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

        this.clearBossFrameBackground(sourceContext, frameRect.width, frameRect.height, sourceKey);
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

        this.clearBossFrameBackground(sourceContext, frameRect.width, frameRect.height, sourceKey);
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
      sourceKey === 'boss-4-attack-source' ||
      sourceKey === 'boss-4-attack-special-source' ||
      sourceKey === 'boss-6-attack-source' ||
      sourceKey === 'boss-6-2-attack-source' ||
      sourceKey === 'boss-6-2-attack-special-source';
    const gutter = useWideAttackFrame ? 0 : BOSS_FRAME_GUTTER;
    const isChargeFrame = sourceKey.endsWith('-charge-source');
    const horizontalGutter = isChargeFrame ||
      sourceKey === 'boss-4-move-source' ||
      sourceKey === 'boss-4-hit-source'
      ? 0
      : gutter;
    const bottomGutter = sourceKey === 'boss-4-move-source' || isChargeFrame ? 0 : gutter;
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
    if (
      sourceKey === 'boss-4-attack-source' ||
      sourceKey === 'boss-4-attack-special-source' ||
      sourceKey.endsWith('-charge-source')
    ) {
      const frameBounds = layout.frameBoundsBySource[sourceKey] ?? [];
      const referenceHeight = Math.max(
        sourceBounds.height,
        ...frameBounds.map((bounds) => bounds.height),
      );

      return layout.targetHeight / referenceHeight;
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

        const heightScale = targetBounds.height / sourceBounds.height;
        const needsWideCanvas = PLAYER_HIT_FIT_WIDTH_SOURCE_KEYS.has(sourceKey);
        const scale = needsWideCanvas
          ? heightScale * PLAYER_HIT_WIDE_FRAME_SCALE_MULTIPLIER
          : heightScale;
        const drawWidth = sourceBounds.width * scale;
        const drawHeight = sourceBounds.height * scale;
        const canvas = document.createElement('canvas');
        canvas.width = needsWideCanvas
          ? Math.ceil(Math.max(targetImage.width, drawWidth + BOSS_FRAME_PADDING * 2))
          : targetImage.width;
        canvas.height = targetImage.height;

        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        const drawX = needsWideCanvas
          ? (canvas.width - drawWidth) / 2
          : targetBounds.x + (targetBounds.width - drawWidth) / 2;
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

  clearBossFrameBackground(context, width, height, sourceKey) {
    if (sourceKey.endsWith('-charge-source')) {
      this.clearEdgeChromaBackground(context, width, height);
      return;
    }

    this.clearEdgeWhiteBackground(context, width, height);
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

  clearEdgeChromaBackground(context, width, height) {
    const frameData = context.getImageData(0, 0, width, height);
    const pixels = frameData.data;
    const visited = new Uint8Array(width * height);
    const stack = [];

    const isBackgroundPixel = (pixelIndex) => {
      const dataIndex = pixelIndex * 4;
      const red = pixels[dataIndex];
      const green = pixels[dataIndex + 1];
      const blue = pixels[dataIndex + 2];
      const alpha = pixels[dataIndex + 3];
      const isWhite = red > 245 && green > 245 && blue > 245;
      const isHotPink = red > 235 && green < 70 && blue > 95 && blue < 190;

      return alpha > 0 && (isWhite || isHotPink);
    };

    const pushIfBackground = (pixelIndex) => {
      if (
        pixelIndex < 0 ||
        pixelIndex >= visited.length ||
        visited[pixelIndex] ||
        !isBackgroundPixel(pixelIndex)
      ) {
        return;
      }

      visited[pixelIndex] = 1;
      stack.push(pixelIndex);
    };

    for (let x = 0; x < width; x += 1) {
      pushIfBackground(x);
      pushIfBackground((height - 1) * width + x);
    }

    for (let y = 0; y < height; y += 1) {
      pushIfBackground(y * width);
      pushIfBackground(y * width + width - 1);
    }

    while (stack.length > 0) {
      const pixelIndex = stack.pop();
      const dataIndex = pixelIndex * 4;
      const x = pixelIndex % width;

      pixels[dataIndex + 3] = 0;

      if (x > 0) {
        pushIfBackground(pixelIndex - 1);
      }
      if (x < width - 1) {
        pushIfBackground(pixelIndex + 1);
      }
      pushIfBackground(pixelIndex - width);
      pushIfBackground(pixelIndex + width);
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

  createRuntimeAtlas() {
    createRuntimeSpriteAtlas(this, [
      'char-stand',
      'char-jump',
      ...Array.from({ length: SHEET_COLUMNS * SHEET_ROWS }, (_, index) => `char-walk-${index + 1}`),
      'coin',
      'ball',
      'checkpoint',
      'goal',
      'boss-projectile',
      'crit-hit',
    ], { reset: true });
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

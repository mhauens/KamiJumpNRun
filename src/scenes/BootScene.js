import Phaser from 'phaser';
import mainCharStandUrl from '../../assets/mainChar_stand.png';
import mainCharJumpUrl from '../../assets/mainChar_jump.png';
import mainCharWalkUrl from '../../assets/mainChar_walk.png';
import backgroundUrl from '../../assets/background.png';
import bridgeHillsBackgroundUrl from '../../assets/bridge_hills_background.png';
import skyRouteBackgroundUrl from '../../assets/sky_route_background.png';
import cloudGardenBackgroundUrl from '../../assets/cloud_garden_background.png';
import championRidgeBackgroundUrl from '../../assets/champion_ridge_background.png';
import riverStepsBackgroundUrl from '../../assets/river_steps_background.png';
import groundPlatformUrl from '../../assets/ground_platform.png';
import levelTemplateUrl from '../../assets/level_template.png';
import startScreenUrl from '../../assets/start_screen.png';

const WALK_FRAME_VISUAL_SCALE = 0.72;
const WALK_FRAME_VERTICAL_OFFSET = 230;

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

    this.createLoadingLabel();
  }

  create() {
    this.createCharacterWalkTextures();
    this.createGeneratedTextures();

    this.scene.start('StartScene');
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

  createGeneratedTextures() {
    this.createPlatformTexture();
    this.createCoinTexture();
    this.createBallTexture();
    this.createCheckpointTexture();
    this.createGoalTexture();
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
}

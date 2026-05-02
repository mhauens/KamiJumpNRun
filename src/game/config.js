import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions.js';
import { BootScene } from '../scenes/BootScene.js';
import { StartScene } from '../scenes/StartScene.js';
import { LevelScene } from '../scenes/LevelScene.js';
import { EndScene } from '../scenes/EndScene.js';

const isAppleTouchDevice = typeof navigator !== 'undefined' &&
  (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

export const gameConfig = {
  type: isAppleTouchDevice ? Phaser.CANVAS : Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#7ed2ff',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StartScene, LevelScene, EndScene],
};

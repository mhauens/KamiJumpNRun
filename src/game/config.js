import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions.js';
import { BootScene } from '../scenes/BootScene.js';
import { StartScene } from '../scenes/StartScene.js';
import { LevelScene } from '../scenes/LevelScene.js';
import { EndScene } from '../scenes/EndScene.js';
import { isAppleTouchDevice } from '../utils/device.js';

export const gameConfig = {
  type: isAppleTouchDevice() ? Phaser.CANVAS : Phaser.AUTO,
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
  input: {
    gamepad: true,
    activePointers: 4,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StartScene, LevelScene, EndScene],
};

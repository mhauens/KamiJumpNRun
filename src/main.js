import Phaser from 'phaser';
import './styles.css';
import { gameConfig } from './game/config.js';
import { installVisibilityMute } from './utils/visibilityMute.js';

window.addEventListener('load', () => {
  const mountNode = document.getElementById('app');

  if (!mountNode) {
    throw new Error('Missing #app mount node');
  }

  const game = new Phaser.Game({
    ...gameConfig,
    parent: mountNode,
  });
  installVisibilityMute(game);
});

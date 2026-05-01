import Phaser from 'phaser';
import './styles.css';
import { gameConfig } from './game/config.js';

window.addEventListener('load', () => {
  const mountNode = document.getElementById('app');

  if (!mountNode) {
    throw new Error('Missing #app mount node');
  }

  new Phaser.Game({
    ...gameConfig,
    parent: mountNode,
  });
});

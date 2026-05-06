import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';
import { LEVELS } from '../data/levels.js';
import { saveHighScore } from '../utils/storage.js';
import { readGamepadInput, refreshGamepads } from '../utils/gamepad.js';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.score = data.score ?? 0;
    this.highScore = data.highScore ?? this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    saveHighScore(this.highScore);
  }

  create() {
    this.gamepadButtons = {};

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x7ed2ff).setOrigin(0, 0);
    this.add.rectangle(90, 90, GAME_WIDTH - 180, GAME_HEIGHT - 180, 0x18334f, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(4, 0xb4f0ff, 0.95);

    this.add
      .text(GAME_WIDTH / 2, 180, `Alle ${LEVELS.length} Level geschafft!`, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        stroke: '#0e2135',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 285, `Dein Run-Score: ${this.score} Coins`, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '32px',
        color: '#ffef98',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 345, `Highscore: ${this.highScore} Coins`, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '28px',
        color: '#9ce7ff',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        450,
        `Checkpoint-Respawns, Bonus-Baelle und ${LEVELS.length} Level sind aktiv.`,
        {
          fontFamily: 'Verdana, sans-serif',
          fontSize: '24px',
          color: '#ffffff',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        550,
        'Druecke Space oder Controller-A zurueck zum Startscreen',
        {
          fontFamily: 'Verdana, sans-serif',
          fontSize: '26px',
          color: '#7df0a6',
        },
      )
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('StartScene');
    });

    refreshGamepads(this);
  }

  update() {
    const gamepadInput = readGamepadInput(this, this.gamepadButtons);
    this.gamepadButtons = gamepadInput.buttons;

    if (gamepadInput.actionJustPressed) {
      this.scene.start('StartScene');
    }
  }
}

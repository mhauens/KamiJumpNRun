import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';

const BUTTON_WIDTH = 260;
const BUTTON_HEIGHT = 92;
const BUTTON_X = GAME_WIDTH - 190;
const BUTTON_Y = GAME_HEIGHT - 118;

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'start-screen')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.createPlayButton();

    this.input.keyboard.once('keydown-SPACE', () => {
      this.startGame();
    });
  }

  createPlayButton() {
    const button = this.add.container(BUTTON_X, BUTTON_Y);
    const hitArea = this.add
      .rectangle(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
    const shape = this.add.graphics();
    const label = this.add.text(0, 0, 'PLAY', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '46px',
      fontStyle: 'bold',
      color: '#fff2a7',
      stroke: '#6b240f',
      strokeThickness: 9,
    }).setOrigin(0.5);

    shape.fillStyle(0x5d260e, 0.85);
    shape.fillRoundedRect(
      -BUTTON_WIDTH / 2 + 8,
      -BUTTON_HEIGHT / 2 + 10,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      26,
    );
    shape.fillStyle(0xff8d22, 1);
    shape.fillRoundedRect(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      26,
    );
    shape.lineStyle(6, 0xffe29d, 1);
    shape.strokeRoundedRect(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      26,
    );
    shape.fillStyle(0xffd979, 0.85);
    shape.fillRoundedRect(-BUTTON_WIDTH / 2 + 24, -BUTTON_HEIGHT / 2 + 18, BUTTON_WIDTH - 58, 22, 12);

    button.add([hitArea, shape, label]);

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scale: 1.05,
        duration: 110,
        ease: 'Back.out',
      });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 110,
        ease: 'Sine.out',
      });
    });

    hitArea.on('pointerdown', () => {
      hitArea.disableInteractive();
      this.tweens.add({
        targets: button,
        scale: 0.94,
        duration: 80,
        yoyo: true,
        onComplete: () => this.startGame(),
      });
    });

    this.tweens.add({
      targets: button,
      y: BUTTON_Y - 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  startGame() {
    this.scene.start('LevelScene', {
      levelIndex: 0,
      score: 0,
    });
  }
}

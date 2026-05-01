import Phaser from 'phaser';
import { LEVELS } from '../data/levels.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';
import { loadHighScore, saveHighScore } from '../utils/storage.js';

const PLAYER_SCALE = 0.11;
const PLAYER_SPEED = 320;
const JUMP_VELOCITY = -660;
const FALL_LIMIT_PADDING = 220;
const FALL_PENALTY = 10;
const GROUNDED_GRACE_MS = 120;
const JUMP_VISUAL_MIN_SPEED = 40;
const RESPAWN_PLATFORM_MARGIN = 20;
const RESPAWN_SURFACE_OFFSET = 0;
const PLAYER_BODY_WIDTH = 320;
const PLAYER_BODY_HEIGHT = 980;
const PLAYER_FOOT_VISUAL_SINK = 30;
const PLATFORM_SURFACE_HEIGHT = 72;
const HUD_PANEL_WIDTH = 370;
const HUD_PANEL_HEIGHT = 146;
const HUD_TEXT_X = 34;
const HUD_HELP_WRAP_WIDTH = HUD_PANEL_WIDTH - 32;

export class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.highScore = data.highScore ?? loadHighScore();
    this.level = LEVELS[this.levelIndex];
    this.respawnPoint = this.resolveRespawnPoint(this.level.spawn);
    this.levelComplete = false;
    this.isRespawning = false;
    this.lastGroundedAt = 0;
  }

  create() {
    this.createWorld();
    this.createPlatforms();
    this.createPlayer();
    this.createCollectibles();
    this.createCheckpoints();
    this.createGoal();
    this.createHud();
    this.configureCollisions();
    this.configureCamera();
    this.showToast(`Level ${this.level.id}: ${this.level.name}`);
  }

  createWorld() {
    this.physics.world.setBounds(
      0,
      0,
      this.level.worldWidth,
      this.level.worldHeight,
    );
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.level.backgroundKey ?? 'background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setScrollFactor(0)
      .setDepth(-30);

  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    this.level.platforms.forEach((platform) => {
      const block = this.platforms.create(
        platform.x,
        platform.y,
        'platform-hitbox',
      );

      block
        .setOrigin(0, 0)
        .setDisplaySize(platform.width, platform.height)
        .refreshBody()
        .setVisible(false);

      this.createPlatformVisual(platform);
    });
  }

  createPlatformVisual(platform) {
    const surfaceHeight = Math.min(PLATFORM_SURFACE_HEIGHT, platform.height);
    const dirtHeight = Math.max(platform.height - surfaceHeight, 0);

    this.add
      .tileSprite(
        platform.x,
        platform.y,
        platform.width,
        surfaceHeight,
        'platform-surface',
      )
      .setOrigin(0, 0)
      .setDepth(2);

    if (dirtHeight <= 0) {
      return;
    }

    this.add
      .tileSprite(
        platform.x,
        platform.y + surfaceHeight,
        platform.width,
        dirtHeight,
        'platform-dirt',
      )
      .setOrigin(0, 0)
      .setDepth(1);
  }

  createPlayer() {
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
    });

    this.player = this.physics.add
      .sprite(this.respawnPoint.x, this.respawnPoint.y, 'char-stand')
      .setOrigin(0.5, 1)
      .setScale(PLAYER_SCALE)
      .setCollideWorldBounds(true)
      .setDepth(10);

    this.player.setBounce(0);
    this.player.setDragX(1500);
    this.player.setMaxVelocity(420, 1100);
    this.configurePlayerBody();
    this.playerState = 'stand';
    this.lastGroundedAt = this.time.now;
    this.createPlayerAnimations();
  }

  configurePlayerBody() {
    const frame = this.player.frame;
    const bodyOffsetX = (frame.width - PLAYER_BODY_WIDTH) / 2;
    const bodyOffsetY =
      frame.height - PLAYER_BODY_HEIGHT - PLAYER_FOOT_VISUAL_SINK / PLAYER_SCALE;

    this.player.body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
    this.player.body.setOffset(bodyOffsetX, bodyOffsetY);
  }

  createPlayerAnimations() {
    if (this.anims.exists('player-walk')) {
      return;
    }

    this.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'char-walk-1' },
        { key: 'char-walk-2' },
        { key: 'char-walk-3' },
        { key: 'char-walk-4' },
        { key: 'char-walk-5' },
        { key: 'char-walk-6' },
        { key: 'char-walk-7' },
        { key: 'char-walk-8' },
      ],
      frameRate: 10,
      repeat: -1,
    });
  }

  createCollectibles() {
    this.collectibles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.createPickupSet(this.level.coins, 'coin', 1, 1);
    this.createPickupSet(this.level.balls, 'ball', 10, 1.08);
  }

  createPickupSet(entries, texture, value, scale) {
    entries.forEach((entry) => {
      const pickup = this.collectibles
        .create(entry.x, entry.y, texture)
        .setScale(scale)
        .setDepth(8);

      pickup.body.setAllowGravity(false);
      pickup.body.setImmovable(true);
      pickup.setData('value', value);
      pickup.setData('baseY', entry.y);

      this.tweens.add({
        targets: pickup,
        y: entry.y - 10,
        duration: 900,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: Math.floor((entry.x + entry.y) % 300),
      });
    });
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();

    this.level.checkpoints.forEach((entry, index) => {
      const checkpoint = this.checkpoints.create(
        entry.x,
        entry.y + 56,
        'checkpoint',
      );

      checkpoint
        .setOrigin(0.5, 1)
        .setDepth(7)
        .setData('spawn', this.resolveRespawnPoint(entry))
        .setData('label', entry.label)
        .setData('activated', false)
        .setTint(index === 0 ? 0xffb39d : 0xffffff);
    });
  }

  createGoal() {
    this.goal = this.physics.add.staticImage(
      this.level.goal.x,
      this.level.goal.y + this.level.goal.height,
      'goal',
    );

    this.goal
      .setOrigin(0.5, 1)
      .setDisplaySize(this.level.goal.width, this.level.goal.height)
      .setDepth(7)
      .refreshBody();
  }

  createHud() {
    this.hudPanel = this.add
      .rectangle(18, 18, HUD_PANEL_WIDTH, HUD_PANEL_HEIGHT, 0x10243a, 0.78)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.hudPanel.setStrokeStyle(2, 0xa5e0ff, 0.9);

    this.levelText = this.add
      .text(HUD_TEXT_X, 28, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.scoreText = this.add
      .text(HUD_TEXT_X, 58, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '20px',
        color: '#ffef98',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.bestText = this.add
      .text(HUD_TEXT_X, 84, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '18px',
        color: '#9ce7ff',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.helpText = this.add
      .text(HUD_TEXT_X, 108, 'A/D oder Pfeile bewegen  Space springt  R respawn', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        wordWrap: { width: HUD_HELP_WRAP_WIDTH },
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.toastText = this.add
      .text(GAME_WIDTH / 2, 110, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '30px',
        color: '#17324d',
        stroke: '#ffffff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0);

    this.refreshHud();
  }

  configureCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.collectPickup,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.checkpoints,
      this.activateCheckpoint,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.goal,
      this.completeLevel,
      null,
      this,
    );
  }

  configureCamera() {
    this.cameras.main.setBounds(
      0,
      0,
      this.level.worldWidth,
      GAME_HEIGHT,
    );
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -140, 40);
    this.cameras.main.setDeadzone(280, 200);
  }

  update() {
    if (this.levelComplete) {
      this.player.setVelocityX(0);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.respawnPlayer(true);
      return;
    }

    this.handleMovement();

    if (this.player.y > this.level.worldHeight + FALL_LIMIT_PADDING) {
      this.respawnPlayer(false);
    }
  }

  handleMovement() {
    const body = this.player.body;

    if (!body) {
      return;
    }

    const groundedNow =
      body.blocked.down || body.touching.down || body.wasTouching.down;
    const canJump = groundedNow || this.time.now - this.lastGroundedAt <= GROUNDED_GRACE_MS;
    let jumpedThisFrame = false;

    const movingLeft = this.keys.left.isDown || this.keys.leftArrow.isDown;
    const movingRight = this.keys.right.isDown || this.keys.rightArrow.isDown;

    if (movingLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && canJump) {
      this.player.setVelocityY(JUMP_VELOCITY);
      jumpedThisFrame = true;
    }

    if (!jumpedThisFrame && groundedNow && body.velocity.y >= 0) {
      this.lastGroundedAt = this.time.now;
    }

    const groundedRecently = this.time.now - this.lastGroundedAt <= GROUNDED_GRACE_MS;
    const isAirborneVisual =
      jumpedThisFrame ||
      (!groundedRecently && Math.abs(body.velocity.y) > JUMP_VISUAL_MIN_SPEED);
    const movingOnGround =
      !isAirborneVisual &&
      (movingLeft || movingRight) &&
      Math.abs(body.velocity.x) > 1;
    const nextState = isAirborneVisual ? 'jump' : movingOnGround ? 'walk' : 'stand';

    this.setPlayerVisualState(nextState);
  }

  setPlayerVisualState(nextState) {
    if (this.playerState === nextState) {
      return;
    }

    this.playerState = nextState;

    if (nextState === 'walk') {
      this.player.play('player-walk', true);
    } else {
      this.player.stop();
      this.player.setTexture(nextState === 'jump' ? 'char-jump' : 'char-stand');
    }

    this.configurePlayerBody();
  }

  collectPickup(player, pickup) {
    if (!pickup.active) {
      return;
    }

    const value = pickup.getData('value') ?? 0;
    this.score += value;
    pickup.disableBody(true, true);

    this.showToast(value >= 10 ? '+10 Bonus Ball' : '+1 Coin');
    this.refreshHud();
  }

  activateCheckpoint(player, checkpoint) {
    if (checkpoint.getData('activated')) {
      return;
    }

    this.checkpoints.children.each((entry) => {
      if (entry.getData('activated')) {
        entry.clearTint();
      }
    });

    checkpoint.setData('activated', true);
    checkpoint.setTint(0x9cff8a);

    const spawn = checkpoint.getData('spawn');
    this.respawnPoint = { ...spawn };
    this.showToast(checkpoint.getData('label'));
  }

  completeLevel() {
    if (this.levelComplete) {
      return;
    }

    this.levelComplete = true;
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }

    this.refreshHud();
    this.showToast(`Level ${this.level.id} geschafft!`);
    this.cameras.main.flash(450, 255, 255, 255);

    this.time.delayedCall(1200, () => {
      const nextIndex = this.levelIndex + 1;

      if (nextIndex < LEVELS.length) {
        this.scene.start('LevelScene', {
          levelIndex: nextIndex,
          score: this.score,
          highScore: this.highScore,
        });
        return;
      }

      this.scene.start('EndScene', {
        score: this.score,
        highScore: this.highScore,
      });
    });
  }

  respawnPlayer(isManual) {
    if (this.isRespawning || this.levelComplete) {
      return;
    }

    this.isRespawning = true;

    if (!isManual) {
      this.score = Math.max(0, this.score - FALL_PENALTY);
      this.refreshHud();
    }

    this.player.body.reset(this.respawnPoint.x, this.respawnPoint.y);
    this.player.setVelocity(0, 0);
    this.player.clearTint();
    this.playerState = 'stand';
    this.lastGroundedAt = this.time.now;
    this.player.stop();
    this.player.setTexture('char-stand');
    this.configurePlayerBody();
    this.cameras.main.shake(150, 0.004);
    this.showToast(isManual ? 'Respawn' : `Fallstrafe -${FALL_PENALTY} Coins`);

    this.time.delayedCall(150, () => {
      this.isRespawning = false;
    });
  }

  refreshHud() {
    this.levelText.setText(`Level ${this.level.id}: ${this.level.name}`);
    this.scoreText.setText(`Coins: ${this.score}`);
    this.bestText.setText(`Bestscore: ${Math.max(this.highScore, this.score)}`);
  }

  showToast(message) {
    this.toastText.setText(message);
    this.toastText.setAlpha(1);
    this.toastText.setScale(0.92);

    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      scale: 1,
      duration: 1100,
      ease: 'Quad.out',
    });
  }

  resolveRespawnPoint(referencePoint) {
    const supportingPlatform = this.level.platforms
      .filter((platform) => {
        const withinHorizontalBounds =
          referencePoint.x >= platform.x - RESPAWN_PLATFORM_MARGIN &&
          referencePoint.x <= platform.x + platform.width + RESPAWN_PLATFORM_MARGIN;

        return withinHorizontalBounds && platform.y >= referencePoint.y;
      })
      .sort((left, right) => left.y - right.y)[0];

    if (!supportingPlatform) {
      return { ...referencePoint };
    }

    return {
      x: referencePoint.x,
      y: supportingPlatform.y - RESPAWN_SURFACE_OFFSET + PLAYER_FOOT_VISUAL_SINK,
    };
  }
}

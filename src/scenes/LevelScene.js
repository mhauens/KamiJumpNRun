import Phaser from 'phaser';
import levelMusicMp3Url from '../../assets/shared/KamisWorldLevel.mp3';
import levelMusicOggUrl from '../../assets/shared/KamisWorldLevel.ogg';
import { LEVELS } from '../data/levels.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';
import { MusicControls } from '../ui/MusicControls.js';
import { loadHighScore, saveHighScore } from '../utils/storage.js';

const PLAYER_SCALE = 0.11;
const PLAYER_SPEED = 320;
const JUMP_VELOCITY = -660;
const FALL_LIMIT_PADDING = 220;
const FALL_PENALTY = 3;
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
const BOSS_FOOT_SINK = 4;
const BOSS_SCALE_MULTIPLIER = 1.22;
const BOSS_BODY_WIDTH_RATIO = 0.62;
const BOSS_BODY_HEIGHT_RATIO = 0.24;
const BOSS_BODY_VERTICAL_SHIFT_RATIO = 0;
const BOSS_INTRO_MS = 6000;
const BOSS_HIT_BOUNCE = -520;
const BOSS_STOMP_MIN_HEIGHT = 20;
const BOSS_STOMP_MAX_HEIGHT = 112;
const BOSS_STOMP_EXTRA_WIDTH = 24;
const BOSS_DIRECTION_DEADZONE = 36;
const BOSS_CONTACT_DAMAGE_HEIGHT = 46;
const PLAYER_HIT_LOCK_MS = 1000;
const BOSS_HIT_LOCK_MS = 1000;
const HEALTH_BAR_WIDTH = 220;
const HEALTH_BAR_HEIGHT = 18;
const HEALTH_BAR_SEGMENTS = 8;
const HEALTH_BAR_SEGMENT_GAP = 4;
const HEALTH_BAR_SEGMENT_WIDTH = Math.floor(
  (HEALTH_BAR_WIDTH - (HEALTH_BAR_SEGMENTS - 1) * HEALTH_BAR_SEGMENT_GAP) /
    HEALTH_BAR_SEGMENTS,
);
const HEALTH_BAR_HEART_PIXEL_SIZE = 6;
const HEALTH_BAR_HEART_WIDTH = HEALTH_BAR_HEART_PIXEL_SIZE * 5;
const HEALTH_BAR_SEGMENT_X = HEALTH_BAR_HEART_WIDTH + 18;
const HEALTH_BAR_BAR_Y = 34;
const HEALTH_BAR_VALUE_Y = 60;
const PLAYER_ARENA_FOOT_SINK = 30;
const BOSS_COUNTDOWN_SECONDS = 3;
const CAMERA_EXIT_PAN_MS = 700;
const BOSS_BASE_HP = 5;
const COIN_PLAYER_HP_BONUS = 0.5;
const PLAYER_CRIT_CHANCE = 0.12;
const BOSS_CRIT_BASE_CHANCE = 0.16;
const BOSS_CRIT_CHANCE_PER_LEVEL = 0.015;
const BOSS_CRIT_MAX_CHANCE = 0.28;
const BOSS_CRIT_REDUCTION_PER_BALL = 0.02;
const CRIT_DAMAGE_MIN = 3;
const CRIT_DAMAGE_MAX = 6;
const CRIT_HIT_DISPLAY_WIDTH = 320;
const CRIT_HIT_Y = 112;
const LEVEL_MUSIC_KEY = 'kamis-world-level';
const LEVEL_MUSIC_VOLUME = 0.05;
const LEVEL_MUSIC_PANEL_WIDTH = 282;
const LEVEL_MUSIC_PANEL_MARGIN = 34;
const PAINT_PUDDLE_LEVEL_IDS = new Set([1, 2]);
const PAINT_PUDDLE_DISPLAY_WIDTH = 420;
const PAINT_PUDDLE_BODY_WIDTH = 170;
const PAINT_PUDDLE_BODY_HEIGHT = 26;
const PAINT_PUDDLE_SURFACE_OFFSET = 4;
const PAINT_PUDDLE_BOSS_TUNING = {
  2: {
    displayWidth: 280,
    surfaceOffset: 19,
  },
};
const PAINT_PUDDLE_LIFETIME_MS = 5200;
const PAINT_PUDDLE_TRIGGERED_LIFETIME_MS = 2400;
const PAINT_PUDDLE_SLOW_MS = 1800;
const PAINT_PUDDLE_SLOW_MULTIPLIER = 0.45;
const PAINT_PUDDLE_SPAWN_DELAY_MS = 520;
const PAINT_PUDDLE_MIN_DISTANCE = 120;
const PAINT_PUDDLE_SPAWN_CHANCE = 0.18;
const PAINT_PUDDLE_SPAWN_REDUCTION_PER_BALL = 0.02;
const PAINT_PUDDLE_SPAWN_COOLDOWN_MS = 5000;
const PAINT_PUDDLE_CONTENT_ALPHA_THRESHOLD = 128;
const PAINT_PUDDLE_STEP_TOLERANCE = 18;
const PAINT_PUDDLE_STEP_HORIZONTAL_INSET = 10;

export class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.levelStartScore = data.levelStartScore ?? this.score;
    this.highScore = data.highScore ?? loadHighScore();
    this.level = LEVELS[this.levelIndex];
    this.respawnPoint = this.resolveRespawnPoint(this.level.spawn);
    this.levelComplete = false;
    this.isRespawning = false;
    this.lastGroundedAt = 0;
    this.bossState = 'stand';
    this.bossIntroActive = false;
    this.bossCountdownActive = false;
    this.bossFightActive = false;
    this.bossIntroShown = false;
    this.bossDefeated = false;
    this.bossExitUnlocked = false;
    this.awaitingBossRetry = false;
    this.playerIsHit = false;
    this.playerBossContactDamageArmed = true;
    this.bossIsHit = false;
    this.levelCoinHpBonus = 0;
    this.levelBallsCollected = 0;
    this.playerMaxHp = BOSS_BASE_HP;
    this.bossMaxHp = BOSS_BASE_HP + this.level.coins.length;
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    this.nextBossAttackAt = 0;
    this.bossDirection = -1;
    this.bossScale = 1;
    this.bossBottomPaddingByTexture = new Map();
    this.bossBodyBounds = null;
    this.playerSlowUntil = 0;
    this.playerJumpBlockedUntil = 0;
    this.nextPaintPuddleSpawnAt = 0;
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopBossSplashSound();
    });

    this.createWorld();
    this.createPlatforms();
    this.createPlayer();
    this.createCollectibles();
    this.createCheckpoints();
    this.createGoal();
    this.createBoss();
    this.createHud();
    this.createBossRetryUi();
    this.createLevelMusicControls();
    this.configureCollisions();
    this.configureCamera();
    this.showToast(`Level ${this.level.id}: ${this.level.name}`);
  }

  createLevelMusicControls() {
    this.musicControls = new MusicControls(this, {
      audioKey: LEVEL_MUSIC_KEY,
      audioUrls: [levelMusicOggUrl, levelMusicMp3Url],
      x: GAME_WIDTH - LEVEL_MUSIC_PANEL_WIDTH - LEVEL_MUSIC_PANEL_MARGIN,
      y: LEVEL_MUSIC_PANEL_MARGIN,
      initialVolume: LEVEL_MUSIC_VOLUME,
      align: 'right',
      depth: 180,
      persistBetweenScenes: true,
    });
    this.musicControls.start();
  }

  ensureBossAnimations() {
    this.scene.get('BootScene')?.createBossAnimations(this.level.id);
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
    const bodyOffsetX = Math.max((frame.width - PLAYER_BODY_WIDTH) / 2, 0);
    const bodyOffsetY =
      frame.height - PLAYER_BODY_HEIGHT - PLAYER_FOOT_VISUAL_SINK / PLAYER_SCALE;

    this.player.body.setSize(
      Math.min(PLAYER_BODY_WIDTH, frame.width),
      Math.min(PLAYER_BODY_HEIGHT, frame.height),
    );
    this.player.body.setOffset(bodyOffsetX, Math.max(bodyOffsetY, 0));
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

    this.createPickupSet(this.level.coins, 'coin', 1, 1, COIN_PLAYER_HP_BONUS, 'coin');
    this.createPickupSet(this.level.balls, 'ball', 10, 1.08, 0, 'ball');
  }

  createPickupSet(entries, texture, value, scale, bossHpBonus, pickupType) {
    entries.forEach((entry) => {
      const pickup = this.collectibles
        .create(entry.x, entry.y, texture)
        .setScale(scale)
        .setDepth(8);

      pickup.body.setAllowGravity(false);
      pickup.body.setImmovable(true);
      pickup.setData('value', value);
      pickup.setData('bossHpBonus', bossHpBonus);
      pickup.setData('pickupType', pickupType);
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

    this.goal.disableBody(true, true);
  }

  createBoss() {
    const bossConfig = this.level.boss;
    const standKey = `boss-${this.level.id}-stand`;
    this.bossScale = this.resolveBossScale(standKey);

    this.boss = this.physics.add
      .sprite(bossConfig.spawn.x, this.getBossVisualY(standKey), standKey)
      .setOrigin(0.5, 1)
      .setScale(this.bossScale)
      .setCollideWorldBounds(false)
      .setDepth(9);

    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.configureBossBody();
    this.boss.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => this.alignBossToFloor());

    this.projectiles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.paintPuddles = this.physics.add.staticGroup();
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

    this.createHealthBars();

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
    this.updateLevelHudVisibility();
  }

  setLevelHudVisible(visible) {
    [
      this.hudPanel,
      this.levelText,
      this.scoreText,
      this.bestText,
      this.helpText,
    ].forEach((entry) => entry?.setVisible(visible));
  }

  updateLevelHudVisibility() {
    const visible = !(
      this.bossIntroActive ||
      this.bossCountdownActive ||
      this.bossFightActive ||
      this.awaitingBossRetry
    );

    this.setLevelHudVisible(visible);
  }

  createHealthBars() {
    this.playerHealthBar = this.createSegmentedHealthBar({
      x: GAME_WIDTH / 2 - HEALTH_BAR_SEGMENT_X - HEALTH_BAR_WIDTH - 92,
      y: 20,
      label: 'Kami',
      heartColor: 0xd91f27,
      heartShadowColor: 0x5e0a0f,
      fillColor: 0xff3b30,
      fillHighlightColor: 0xff8a80,
      emptyColor: 0x26384b,
      emptyHighlightColor: 0x4f6477,
      valueStroke: '#000000',
    });

    this.bossHealthBar = this.createSegmentedHealthBar({
      x: GAME_WIDTH / 2 + 40,
      y: 20,
      label: this.level.boss.name ?? `Boss ${this.level.id}`,
      heartColor: 0x8ddf18,
      heartShadowColor: 0x3e6705,
      fillColor: 0x8ef01d,
      fillHighlightColor: 0xd6ff86,
      emptyColor: 0x26384b,
      emptyHighlightColor: 0x4f6477,
      valueStroke: '#000000',
    });
  }

  createSegmentedHealthBar({
    x,
    y,
    label,
    heartColor,
    heartShadowColor,
    fillColor,
    fillHighlightColor,
    emptyColor,
    emptyHighlightColor,
    valueStroke,
  }) {
    const container = this.add.container(x, y)
      .setScrollFactor(0)
      .setDepth(110)
      .setVisible(false);

    const labelText = this.add
      .text(0, 0, label, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const heart = this.add.graphics().setScrollFactor(0);
    const segments = this.add.graphics().setScrollFactor(0);
    const valueText = this.add
      .text(HEALTH_BAR_SEGMENT_X + HEALTH_BAR_WIDTH / 2, HEALTH_BAR_VALUE_Y, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: valueStroke,
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    this.drawPixelHeart(heart, 0, HEALTH_BAR_BAR_Y - 8, heartColor, heartShadowColor);
    container.add([labelText, heart, segments, valueText]);

    return {
      container,
      labelText,
      heart,
      segments,
      valueText,
      fillColor,
      fillHighlightColor,
      emptyColor,
      emptyHighlightColor,
    };
  }

  drawPixelHeart(graphics, x, y, fillColor, shadowColor) {
    const pattern = [
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ];
    const pixel = HEALTH_BAR_HEART_PIXEL_SIZE;

    graphics.clear();

    pattern.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (!cell) {
          return;
        }

        graphics.fillStyle(shadowColor, 1);
        graphics.fillRect(
          x + columnIndex * pixel + 2,
          y + rowIndex * pixel + 2,
          pixel,
          pixel,
        );

        graphics.fillStyle(fillColor, 1);
        graphics.fillRect(
          x + columnIndex * pixel,
          y + rowIndex * pixel,
          pixel,
          pixel,
        );
      });
    });
  }

  renderSegmentedHealthBar(bar, currentHp, maxHp) {
    const progress = maxHp > 0 ? (currentHp / maxHp) * HEALTH_BAR_SEGMENTS : 0;

    bar.segments.clear();

    for (let index = 0; index < HEALTH_BAR_SEGMENTS; index += 1) {
      const x = HEALTH_BAR_SEGMENT_X + index * (HEALTH_BAR_SEGMENT_WIDTH + HEALTH_BAR_SEGMENT_GAP);
      const fillProgress = Phaser.Math.Clamp(progress - index, 0, 1);
      const innerWidth = HEALTH_BAR_SEGMENT_WIDTH - 4;
      const filledWidth = Math.round(innerWidth * fillProgress);

      bar.segments.fillStyle(0x081018, 1);
      bar.segments.fillRect(x, HEALTH_BAR_BAR_Y, HEALTH_BAR_SEGMENT_WIDTH, HEALTH_BAR_HEIGHT);

      bar.segments.fillStyle(bar.emptyColor, 1);
      bar.segments.fillRect(x + 2, HEALTH_BAR_BAR_Y + 2, innerWidth, HEALTH_BAR_HEIGHT - 4);

      bar.segments.fillStyle(bar.emptyHighlightColor, 0.85);
      bar.segments.fillRect(x + 2, HEALTH_BAR_BAR_Y + 2, innerWidth, 4);

      if (filledWidth <= 0) {
        continue;
      }

      bar.segments.fillStyle(bar.fillColor, 1);
      bar.segments.fillRect(x + 2, HEALTH_BAR_BAR_Y + 2, filledWidth, HEALTH_BAR_HEIGHT - 4);

      bar.segments.fillStyle(bar.fillHighlightColor, 0.85);
      bar.segments.fillRect(x + 2, HEALTH_BAR_BAR_Y + 2, filledWidth, 4);
    }

    bar.valueText.setText(`${currentHp}/${maxHp}`);
  }

  createBossRetryUi() {
    this.retrySplash = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, `boss-${this.level.id}-retry-splashscreen`)
      .setScrollFactor(0)
      .setDepth(150)
      .setVisible(false);
    this.fitImageToScreen(this.retrySplash);

    this.restartLevelButton = this.createRetryActionButton({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 178,
      width: 392,
      height: 86,
      icon: '↺',
      label: 'Restart Level',
      labelFontSize: '34px',
    });
    this.retryButton = this.createRetryActionButton({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 74,
      width: 300,
      height: 92,
      icon: '↻',
      label: 'Retry',
      labelFontSize: '43px',
    });

    this.restartLevelButton.on('pointerdown', () => {
      if (!this.awaitingBossRetry) {
        return;
      }

      this.scene.start('LevelScene', {
        levelIndex: this.levelIndex,
        score: this.levelStartScore,
        levelStartScore: this.levelStartScore,
        highScore: this.highScore,
      });
    });

    this.retryButton.on('pointerdown', () => {
      if (!this.awaitingBossRetry) {
        return;
      }

      this.startBossCountdown();
    });
  }

  createRetryActionButton({
    x,
    y,
    width,
    height,
    icon: iconText,
    label: labelText,
    labelFontSize,
  }) {
    const button = this.add
      .container(x, y)
      .setScrollFactor(0)
      .setDepth(152)
      .setSize(width, height)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains,
      );
    button.input.cursor = 'pointer';

    const shadow = this.add.graphics();
    shadow.fillStyle(0x7b3f05, 0.92);
    shadow.fillRoundedRect(-width / 2, -height / 2 + 9, width, height, 30);

    const frame = this.add.graphics();
    frame.fillStyle(0x9a580d, 1);
    frame.fillRoundedRect(-width / 2, -height / 2, width, height, 30);
    frame.lineStyle(4, 0x6f3d07, 1);
    frame.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 28);

    const face = this.add.graphics();
    face.fillStyle(0xffa91f, 1);
    face.fillRoundedRect(-width / 2 + 10, -height / 2 + 8, width - 20, height - 22, 24);
    face.fillStyle(0xffd34f, 1);
    face.fillRoundedRect(-width / 2 + 18, -height / 2 + 13, width - 36, 33, 18);
    face.lineStyle(3, 0xfff2a8, 0.85);
    face.strokeRoundedRect(-width / 2 + 16, -height / 2 + 13, width - 32, height - 32, 22);

    const icon = this.add
      .text(labelText === 'Retry' ? -88 : -116, -1, iconText, {
        fontFamily: 'Arial, Verdana, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#8a4a08',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    const label = this.add
      .text(labelText === 'Retry' ? 36 : 38, -1, labelText, {
        fontFamily: 'Arial, Verdana, sans-serif',
        fontSize: labelFontSize,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#8a4a08',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    button.add([shadow, frame, face, icon, label]);
    button.setVisible(false);
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', () => button.setScale(0.98));
    button.on('pointerup', () => button.setScale(1.04));

    return button;
  }

  showBossRetryUi() {
    this.fitImageToScreen(this.retrySplash);
    this.retrySplash.setVisible(true);
    this.restartLevelButton.setVisible(true);
    this.retryButton.setVisible(true);
    this.updateLevelMusicPause();
    this.playBossSplashSound('retry');
  }

  hideBossRetryUi() {
    this.stopBossSplashSound();
    this.retrySplash?.setVisible(false);
    this.restartLevelButton?.setVisible(false);
    this.restartLevelButton?.setScale(1);
    this.retryButton?.setVisible(false);
    this.retryButton?.setScale(1);
    this.updateLevelMusicPause();
  }

  configureCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.collider(this.projectiles, this.platforms, this.destroyProjectile, null, this);
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
    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerBossOverlap,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.projectiles,
      this.handleProjectileHit,
      null,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.paintPuddles,
      this.handlePaintPuddleOverlap,
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
    this.updateLevelMusicPause();
    this.updateLevelHudVisibility();

    if (this.levelComplete) {
      this.player.setVelocityX(0);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.respawnPlayer(true);
      return;
    }

    this.updateBossTrigger();
    this.updateBossExit();
    this.handleMovement();
    this.checkBossStomp();
    this.updateBoss();
    this.updateProjectiles();
    this.rearmBossContactDamage();

    if (this.player.y > this.level.worldHeight + FALL_LIMIT_PADDING) {
      this.respawnPlayer(false);
    }
  }

  updateLevelMusicPause() {
    this.musicControls?.setAutoPaused(Boolean(this.bossSplash) || this.awaitingBossRetry);
  }

  updateBossTrigger() {
    if (
      this.bossFightActive ||
      this.bossIntroActive ||
      this.bossCountdownActive ||
      this.awaitingBossRetry ||
      this.bossDefeated ||
      this.player.x < this.level.boss.triggerX
    ) {
      return;
    }

    if (this.bossIntroShown) {
      this.startBossCountdown();
      return;
    }

    this.startBossIntro();
  }

  updateBossExit() {
    if (!this.bossDefeated || this.bossExitUnlocked || this.player.x < this.level.boss.arenaRight - 90) {
      return;
    }

    this.bossExitUnlocked = true;
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
      Phaser.Math.Clamp(
        this.player.x + 140,
        GAME_WIDTH / 2,
        this.level.worldWidth - GAME_WIDTH / 2,
      ),
      GAME_HEIGHT / 2,
      CAMERA_EXIT_PAN_MS,
      'Sine.easeInOut',
    );

    this.time.delayedCall(CAMERA_EXIT_PAN_MS, () => {
      if (!this.levelComplete) {
        this.cameras.main.startFollow(this.player, true, 0.05, 0.08, -140, 40);
      }
    });
  }

  handleMovement() {
    const body = this.player.body;

    if (!body) {
      return;
    }

    if (this.bossIntroActive || this.bossCountdownActive || this.awaitingBossRetry || this.playerIsHit) {
      this.player.setVelocityX(0);
      return;
    }

    const groundedNow =
      body.blocked.down || body.touching.down || body.wasTouching.down;
    const jumpBlocked = this.isPlayerJumpBlocked();
    const canJump = !jumpBlocked &&
      (groundedNow || this.time.now - this.lastGroundedAt <= GROUNDED_GRACE_MS);
    let jumpedThisFrame = false;

    const movingLeft = this.keys.left.isDown || this.keys.leftArrow.isDown;
    const movingRight = this.keys.right.isDown || this.keys.rightArrow.isDown;

    const playerSpeed = this.getPlayerSpeed();

    if (movingLeft) {
      this.player.setVelocityX(-playerSpeed);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setVelocityX(playerSpeed);
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

  getPlayerSpeed() {
    return this.time.now < this.playerSlowUntil
      ? PLAYER_SPEED * PAINT_PUDDLE_SLOW_MULTIPLIER
      : PLAYER_SPEED;
  }

  isPlayerJumpBlocked() {
    return this.time.now < this.playerJumpBlockedUntil;
  }

  setPlayerVisualState(nextState) {
    if (this.playerState === nextState || this.playerIsHit) {
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

  startBossIntro() {
    this.bossIntroActive = true;
    this.bossIntroShown = true;
    this.bossState = 'intro';
    this.placePlayerAtBossStart();
    this.placeBossAtStart();
    this.activateBossCheckpoint();
    this.createArenaWall();
    this.panCameraToBossArena();
    this.showBossSplash();

    this.time.delayedCall(BOSS_INTRO_MS, () => {
      if (!this.bossIntroActive || this.bossDefeated) {
        return;
      }

      this.hideBossSplash();
      this.startBossCountdown();
    });
  }

  startBossCountdown() {
    if (this.bossCountdownActive || this.bossFightActive || this.bossDefeated) {
      return;
    }

    this.bossIntroActive = false;
    this.bossCountdownActive = true;
    this.awaitingBossRetry = false;
    this.hideBossRetryUi();
    this.placePlayerAtBossStart();
    this.placeBossAtStart();
    this.activateBossCheckpoint();
    this.createArenaWall();
    this.setArenaCamera();
    this.setHealthBarsVisible(false);
    this.ensureBossAnimations();
    this.showBossCountdown(BOSS_COUNTDOWN_SECONDS);
  }

  startBossFight() {
    this.ensureBossAnimations();
    this.bossCountdownActive = false;
    this.bossIntroActive = false;
    this.bossFightActive = true;
    this.awaitingBossRetry = false;
    this.bossState = 'patrol';
    this.playerBossContactDamageArmed = true;
    this.clearPaintPuddles();
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    this.placePlayerAtBossStart();
    this.placeBossAtStart();
    this.activateBossCheckpoint();
    this.createArenaWall();
    this.nextBossAttackAt = this.time.now + 700;
    this.setHealthBarsVisible(true);
    this.refreshHealthBars();
    this.setArenaCamera();
    this.boss.play(`boss-${this.level.id}-move`, true);
  }

  placePlayerAtBossStart() {
    this.player.setPosition(
      this.level.boss.playerStart.x,
      this.level.boss.playerStart.y + PLAYER_ARENA_FOOT_SINK,
    );
    this.player.body.reset(this.player.x, this.player.y);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.player.stop();
    this.player.setTexture('char-stand');
    this.playerState = 'stand';
    this.configurePlayerBody();
  }

  placeBossAtStart() {
    const standKey = `boss-${this.level.id}-stand`;
    this.boss.body.enable = true;
    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.setVelocity(0, 0);
    this.boss.setTexture(standKey);
    this.boss.setScale(this.bossScale);
    this.boss.setPosition(this.level.boss.spawn.x, this.getBossVisualY(standKey));
    this.boss.setFlipX(true);
    this.bossDirection = -1;
    this.configureBossBody();
  }

  getBossVisualY(textureKey = this.boss.texture.key) {
    return this.level.boss.floorY +
      this.getTextureBottomPadding(textureKey) * this.bossScale +
      BOSS_FOOT_SINK;
  }

  alignBossToFloor() {
    if (!this.boss || this.bossDefeated) {
      return;
    }

    this.boss.setY(this.getBossVisualY(this.boss.texture.key));
  }

  getBossDefeatedScale(defeatedKey) {
    if (this.level.boss.defeatedScaleMatchesStand) {
      const standKey = `boss-${this.level.id}-stand`;
      const standVisibleHeight = this.getTextureContentBounds(standKey).height;
      const defeatedVisibleHeight = this.getTextureContentBounds(defeatedKey).height;
      const scaleMultiplier = this.level.boss.defeatedStandScaleMultiplier ?? 1;

      return ((standVisibleHeight * this.bossScale) / defeatedVisibleHeight) *
        scaleMultiplier;
    }

    const playerVisibleHeight = this.getTextureContentBounds('char-stand').height * PLAYER_SCALE;
    const defeatedVisibleHeight = this.getTextureContentBounds(defeatedKey).height;

    return (playerVisibleHeight / defeatedVisibleHeight) * this.level.boss.defeatedScaleMultiplier;
  }

  getBossDefeatedY(defeatedKey, defeatedScale) {
    return this.level.boss.floorY +
      this.getTextureBottomPadding(defeatedKey) * defeatedScale +
      this.level.boss.defeatedFootSink;
  }

  resolveBossScale(standKey) {
    const playerVisibleHeight = this.getTextureContentBounds('char-stand').height * PLAYER_SCALE;
    const bossVisibleHeight = this.getTextureContentBounds(standKey).height;

    return (playerVisibleHeight / bossVisibleHeight) *
      BOSS_SCALE_MULTIPLIER *
      this.level.boss.scaleMultiplier;
  }

  getTextureBottomPadding(textureKey) {
    if (!this.bossBottomPaddingByTexture.has(textureKey)) {
      const bounds = this.getTextureContentBounds(textureKey);
      this.bossBottomPaddingByTexture.set(textureKey, bounds.bottomPadding);
    }

    return this.bossBottomPaddingByTexture.get(textureKey);
  }

  getTextureContentBounds(textureKey) {
    const sourceImage = this.textures.get(textureKey).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceImage, 0, 0);

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
      return {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
        bottomPadding: 0,
      };
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      bottomPadding: canvas.height - maxY - 1,
    };
  }

  getTextureAlphaBounds(textureKey, alphaThreshold) {
    const sourceImage = this.textures.get(textureKey).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceImage, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3];

      if (alpha < alphaThreshold) {
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
      return this.getTextureContentBounds(textureKey);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      bottomPadding: canvas.height - maxY - 1,
    };
  }

  activateBossCheckpoint() {
    this.respawnPoint = {
      x: this.level.boss.playerStart.x,
      y: this.level.boss.playerStart.y + PLAYER_ARENA_FOOT_SINK,
    };
    this.showToast(this.level.boss.checkpoint.label);
  }

  createArenaWall() {
    if (this.arenaLeftWall && this.arenaRightWall) {
      return;
    }

    this.arenaLeftWall = this.createArenaBoundary(this.level.boss.arenaLeft);
    this.arenaRightWall = this.createArenaBoundary(this.level.boss.arenaRight);

    this.arenaWallColliders = [
      this.physics.add.collider(this.player, this.arenaLeftWall),
      this.physics.add.collider(this.player, this.arenaRightWall),
    ];
  }

  createArenaBoundary(x) {
    const wall = this.physics.add.staticImage(
      x,
      GAME_HEIGHT / 2,
      'platform-hitbox',
    );

    wall
      .setDisplaySize(24, GAME_HEIGHT)
      .setVisible(false)
      .refreshBody();

    return wall;
  }

  removeArenaWall() {
    this.arenaWallColliders?.forEach((collider) => collider.destroy());
    this.arenaWallColliders = null;

    this.arenaLeftWall?.destroy();
    this.arenaLeftWall = null;
    this.arenaRightWall?.destroy();
    this.arenaRightWall = null;
  }

  fitImageToScreen(image) {
    const scale = Math.max(
      GAME_WIDTH / image.width,
      GAME_HEIGHT / image.height,
    );

    image.setScale(scale);
  }

  getBossSplashAudioConfig(kind) {
    if (kind === 'retry') {
      return this.level.boss.audio?.retrySplash;
    }

    return this.level.boss.audio?.splash;
  }

  playBossSplashSound(kind) {
    const config = this.getBossSplashAudioConfig(kind);

    if (!config?.key || !this.cache.audio.exists(config.key) || this.sound.locked) {
      return;
    }

    this.stopBossSplashSound();

    const sound = this.sound.add(config.key, {
      volume: config.volume ?? 1,
    });

    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      if (this.activeBossSplashSound?.sound === sound) {
        this.activeBossSplashSound = null;
      }

      sound.destroy();
    });

    sound.play();
    this.activeBossSplashSound = { key: config.key, sound };
  }

  stopBossSplashSound() {
    const activeSound = this.activeBossSplashSound?.sound;

    this.activeBossSplashSound = null;

    if (!activeSound) {
      return;
    }

    if (activeSound.isPlaying || activeSound.isPaused) {
      activeSound.stop();
    }

    activeSound.destroy();
  }

  showBossSplash() {
    this.hideBossSplash();
    this.bossSplash = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, `boss-${this.level.id}-splashscreen`)
      .setScrollFactor(0)
      .setDepth(140);

    this.fitImageToScreen(this.bossSplash);
    this.updateLevelMusicPause();
    this.playBossSplashSound('splash');
  }

  panCameraToBossArena() {
    const cameraTargetX = Phaser.Math.Clamp(
      this.level.boss.arenaLeft + GAME_WIDTH / 2,
      GAME_WIDTH / 2,
      this.level.worldWidth - GAME_WIDTH / 2,
    );

    this.cameras.main.stopFollow();
    this.cameras.main.pan(cameraTargetX, GAME_HEIGHT / 2, 1800, 'Sine.easeInOut');
  }

  setArenaCamera() {
    this.cameras.main.stopFollow();
    this.cameras.main.centerOn(
      this.level.boss.arenaLeft + GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
    );
  }

  showBossCountdown(secondsLeft) {
    if (this.countdownText) {
      this.tweens.killTweensOf(this.countdownText);
      this.countdownText.destroy();
    }

    this.countdownText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, secondsLeft > 0 ? String(secondsLeft) : 'Los!', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '96px',
        color: '#ffffff',
        stroke: '#17324d',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(145)
      .setScale(0.8);

    this.tweens.add({
      targets: this.countdownText,
      scale: 1,
      duration: 260,
      ease: 'Back.out',
    });

    this.time.delayedCall(1000, () => {
      if (!this.bossCountdownActive) {
        return;
      }

      if (secondsLeft <= 1) {
        this.countdownText.destroy();
        this.countdownText = null;
        this.startBossFight();
        return;
      }

      this.showBossCountdown(secondsLeft - 1);
    });
  }

  hideBossSplash() {
    if (!this.bossSplash) {
      return;
    }

    this.stopBossSplashSound();
    this.bossSplash.destroy();
    this.bossSplash = null;
    this.updateLevelMusicPause();
  }

  updateBoss() {
    this.recoverBossIfFallen();

    if (!this.bossFightActive || this.bossIsHit || this.bossDefeated) {
      return;
    }

    if (this.bossState === 'attack') {
      this.boss.setVelocityX(0);
      return;
    }

    const bossConfig = this.level.boss;
    const distanceToPlayer = Math.abs(this.player.x - this.boss.x);

    if (distanceToPlayer <= bossConfig.projectileRange && this.time.now >= this.nextBossAttackAt) {
      this.startBossAttack();
      return;
    }

    this.bossState = 'patrol';
    const horizontalDistanceToPlayer = this.player.x - this.boss.x;
    if (Math.abs(horizontalDistanceToPlayer) > BOSS_DIRECTION_DEADZONE) {
      this.bossDirection = horizontalDistanceToPlayer < 0 ? -1 : 1;
    }
    this.boss.setVelocityX(this.bossDirection * bossConfig.speed);

    if (this.boss.x <= bossConfig.arenaLeft + 80) {
      this.bossDirection = 1;
      this.boss.setX(bossConfig.arenaLeft + 80);
    } else if (this.boss.x >= bossConfig.arenaRight - 80) {
      this.bossDirection = -1;
      this.boss.setX(bossConfig.arenaRight - 80);
    }

    this.boss.setVelocityX(this.bossDirection * bossConfig.speed);
    this.boss.setFlipX(this.bossDirection < 0);
    this.boss.play(`boss-${this.level.id}-move`, true);
    this.alignBossToFloor();
  }

  recoverBossIfFallen() {
    if (!this.boss?.body?.enable || this.bossDefeated) {
      return;
    }

    this.boss.setY(this.getBossVisualY());
  }

  respawnBossOnRight() {
    this.boss.setVelocity(0, 0);
    this.boss.body.setAllowGravity(false);
    this.boss.setPosition(this.level.boss.respawnX, this.getBossVisualY());
    this.bossDirection = -1;
    this.configureBossBody();
  }

  checkBossStomp() {
    if (!this.bossFightActive || this.bossDefeated || this.bossIntroActive || this.bossIsHit) {
      return;
    }

    if (this.isPlayerInBossStompZone()) {
      this.damageBoss();
    }
  }

  isPlayerInBossStompZone() {
    const playerIsFalling = this.player.body.velocity.y > 80;
    const stompHalfWidth = this.getBossBodyWorldWidth() / 2 + BOSS_STOMP_EXTRA_WIDTH;
    const horizontallyAligned =
      Math.abs(this.player.x - this.boss.x) <= stompHalfWidth;
    const heightAboveBoss = this.boss.y - this.player.y;
    const aboveBoss =
      heightAboveBoss >= BOSS_STOMP_MIN_HEIGHT &&
      heightAboveBoss <= BOSS_STOMP_MAX_HEIGHT;

    return playerIsFalling && horizontallyAligned && aboveBoss;
  }

  startBossAttack() {
    if (this.bossState === 'attack') {
      return;
    }

    this.bossState = 'attack';
    this.boss.setVelocityX(0);
    this.boss.setFlipX(this.player.x < this.boss.x);
    this.boss.play(`boss-${this.level.id}-attack`, true);
    this.alignBossToFloor();
    this.nextBossAttackAt = this.time.now + this.level.boss.attackCooldown;

    this.time.delayedCall(320, () => {
      if (this.bossFightActive && !this.bossDefeated && this.bossState === 'attack') {
        this.fireBossProjectile();
      }
    });

    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.bossDefeated && this.bossFightActive) {
        this.bossState = 'patrol';
      }
    });
  }

  fireBossProjectile() {
    const direction = this.player.x < this.boss.x ? -1 : 1;
    const bossConfig = this.level.boss;
    const textureKey = `boss-${this.level.id}-shot`;
    const projectile = this.projectiles
      .create(
        this.boss.x + direction * bossConfig.shotOffsetX,
        this.boss.y + bossConfig.shotOffsetY,
        textureKey,
      )
      .setOrigin(0.5)
      .setScale(bossConfig.shotScale)
      .setFlipX(direction < 0)
      .setDepth(8);

    projectile.body.setAllowGravity(false);
    projectile.body.setSize(
      bossConfig.shotBodyWidth / projectile.scaleX,
      bossConfig.shotBodyHeight / projectile.scaleY,
    );
    this.centerProjectileBody(projectile, textureKey, bossConfig);
    projectile.setVelocityX(direction * bossConfig.projectileSpeed);
    projectile.setData('spawnX', projectile.x);
    projectile.setData('range', bossConfig.projectileRange);
    projectile.setData('damage', bossConfig.damage);

    this.scheduleBossPaintPuddle();
  }

  centerProjectileBody(projectile, textureKey, bossConfig) {
    const bounds = this.getTextureContentBounds(textureKey);
    const bodyWidth = bossConfig.shotBodyWidth / projectile.scaleX;
    const bodyHeight = bossConfig.shotBodyHeight / projectile.scaleY;

    projectile.body.setOffset(
      bounds.x + (bounds.width - bodyWidth) / 2,
      bounds.y + (bounds.height - bodyHeight) / 2,
    );
  }

  updateProjectiles() {
    if (!this.projectiles) {
      return;
    }

    this.projectiles.children.each((projectile) => {
      if (!projectile.active) {
        return;
      }

      const spawnX = projectile.getData('spawnX');
      const range = projectile.getData('range');

      if (Math.abs(projectile.x - spawnX) >= range) {
        this.spawnPaintPuddleFromProjectile(projectile);
        projectile.destroy();
      }
    });
  }

  shouldUseBossPaintPuddles() {
    return PAINT_PUDDLE_LEVEL_IDS.has(this.level.id) &&
      this.textures.exists(this.getPaintPuddleTextureKey());
  }

  getPaintPuddleTextureKey() {
    return `boss-${this.level.id}-puddle`;
  }

  getPaintPuddleTuning() {
    return {
      displayWidth: PAINT_PUDDLE_DISPLAY_WIDTH,
      surfaceOffset: PAINT_PUDDLE_SURFACE_OFFSET,
      ...(PAINT_PUDDLE_BOSS_TUNING[this.level.id] ?? {}),
    };
  }

  scheduleBossPaintPuddle() {
    if (
      !this.shouldUseBossPaintPuddles() ||
      this.hasActivePaintPuddle() ||
      this.isPaintPuddleSpawnOnCooldown() ||
      Math.random() > this.getPaintPuddleSpawnChance()
    ) {
      return;
    }

    const targetX = Phaser.Math.Clamp(
      this.player.x,
      this.level.boss.arenaLeft + PAINT_PUDDLE_MIN_DISTANCE,
      this.level.boss.arenaRight - PAINT_PUDDLE_MIN_DISTANCE,
    );

    this.time.delayedCall(PAINT_PUDDLE_SPAWN_DELAY_MS, () => {
      if (
        !this.bossFightActive ||
        this.bossDefeated ||
        this.hasActivePaintPuddle() ||
        this.isPaintPuddleSpawnOnCooldown()
      ) {
        return;
      }

      this.spawnPaintPuddle(targetX, this.level.boss.floorY);
    });
  }

  spawnPaintPuddleFromProjectile(projectile) {
    if (
      !this.shouldUseBossPaintPuddles() ||
      !this.bossFightActive ||
      !projectile?.active ||
      this.hasActivePaintPuddle() ||
      this.isPaintPuddleSpawnOnCooldown() ||
      Math.random() > this.getPaintPuddleSpawnChance()
    ) {
      return;
    }

    const platformTop = this.getPlatformTopAt(projectile.x);
    if (platformTop === null) {
      return;
    }

    this.spawnPaintPuddle(projectile.x, platformTop);
  }

  getPlatformTopAt(x) {
    const matchingPlatforms = this.level.platforms
      .filter((platform) => x >= platform.x && x <= platform.x + platform.width);

    if (matchingPlatforms.length === 0) {
      return null;
    }

    return matchingPlatforms
      .map((platform) => platform.y)
      .sort((a, b) => Math.abs(a - this.level.boss.floorY) - Math.abs(b - this.level.boss.floorY))[0];
  }

  spawnPaintPuddle(x, platformTop) {
    if (
      !this.shouldUseBossPaintPuddles() ||
      this.hasActivePaintPuddle() ||
      this.isPaintPuddleSpawnOnCooldown()
    ) {
      return;
    }

    this.nextPaintPuddleSpawnAt = this.time.now + PAINT_PUDDLE_SPAWN_COOLDOWN_MS;

    const textureKey = this.getPaintPuddleTextureKey();
    const tuning = this.getPaintPuddleTuning();
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
    const bounds = this.getTextureAlphaBounds(
      textureKey,
      PAINT_PUDDLE_CONTENT_ALPHA_THRESHOLD,
    );
    const scale = tuning.displayWidth / source.width;
    const displayHeight = source.height * scale;
    const contentCenterX = bounds.x + bounds.width / 2;
    const imageX = x + (source.width / 2 - contentCenterX) * scale;
    const imageY = platformTop - tuning.surfaceOffset + (source.height / 2 - bounds.y) * scale;
    const puddle = this.paintPuddles
      .create(imageX, imageY, textureKey)
      .setOrigin(0.5)
      .setDisplaySize(tuning.displayWidth, displayHeight)
      .setDepth(6);

    const bodyWidth = PAINT_PUDDLE_BODY_WIDTH / scale;
    const bodyHeight = PAINT_PUDDLE_BODY_HEIGHT / scale;
    puddle.body.setSize(bodyWidth, bodyHeight);
    puddle.body.setOffset(
      bounds.x + (bounds.width - bodyWidth) / 2,
      bounds.y + Math.max(0, bounds.height * 0.24),
    );
    puddle.refreshBody();

    this.tweens.add({
      targets: puddle,
      alpha: 0,
      duration: 260,
      delay: PAINT_PUDDLE_LIFETIME_MS,
      onComplete: () => puddle.destroy(),
    });
  }

  hasActivePaintPuddle() {
    if (!this.paintPuddles) {
      return false;
    }

    return this.paintPuddles.children.entries.some((puddle) => puddle.active);
  }

  isPaintPuddleSpawnOnCooldown() {
    return this.time.now < this.nextPaintPuddleSpawnAt;
  }

  getPaintPuddleSpawnChance() {
    return Phaser.Math.Clamp(
      PAINT_PUDDLE_SPAWN_CHANCE - this.levelBallsCollected * PAINT_PUDDLE_SPAWN_REDUCTION_PER_BALL,
      0,
      PAINT_PUDDLE_SPAWN_CHANCE,
    );
  }

  handlePaintPuddleOverlap(player, puddle) {
    if (
      !this.bossFightActive ||
      !puddle.active ||
      puddle.getData('triggered') ||
      !this.isPlayerSteppingOnPaintPuddle(player, puddle)
    ) {
      return;
    }

    this.playerSlowUntil = Math.max(
      this.playerSlowUntil,
      this.time.now + PAINT_PUDDLE_SLOW_MS,
    );
    this.playerJumpBlockedUntil = Math.max(
      this.playerJumpBlockedUntil,
      this.time.now + PAINT_PUDDLE_SLOW_MS,
    );
    this.tweens.killTweensOf(puddle);
    puddle.setData('triggered', true);
    puddle.body.enable = false;
    puddle.setAlpha(1);
    this.tweens.add({
      targets: puddle,
      alpha: 0,
      duration: 320,
      delay: PAINT_PUDDLE_TRIGGERED_LIFETIME_MS,
      onComplete: () => puddle.destroy(),
    });
  }

  isPlayerSteppingOnPaintPuddle(player, puddle) {
    if (!player.body || !puddle.body) {
      return false;
    }

    const playerBottom = player.body.bottom;
    const playerFootX = player.body.center.x;
    const puddleTop = puddle.body.top;
    const grounded = player.body.blocked.down || player.body.touching.down || player.body.wasTouching.down;
    const withinPuddleHorizontally =
      playerFootX >= puddle.body.left + PAINT_PUDDLE_STEP_HORIZONTAL_INSET &&
      playerFootX <= puddle.body.right - PAINT_PUDDLE_STEP_HORIZONTAL_INSET;

    return grounded &&
      withinPuddleHorizontally &&
      player.body.velocity.y >= -20 &&
      playerBottom >= puddleTop - PAINT_PUDDLE_STEP_TOLERANCE &&
      playerBottom <= puddleTop + puddle.body.height + PAINT_PUDDLE_STEP_TOLERANCE;
  }

  rearmBossContactDamage() {
    if (this.playerBossContactDamageArmed || this.arePlayerAndBossBodiesOverlapping()) {
      return;
    }

    this.playerBossContactDamageArmed = true;
  }

  arePlayerAndBossBodiesOverlapping() {
    if (!this.player?.body || !this.boss?.body || !this.boss.body.enable) {
      return false;
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height,
      ),
      new Phaser.Geom.Rectangle(
        this.boss.body.x,
        this.boss.body.y,
        this.boss.body.width,
        this.boss.body.height,
      ),
    );
  }

  handlePlayerBossOverlap(player, boss) {
    if (!this.bossFightActive || this.bossDefeated || this.bossIntroActive) {
      return;
    }

    const playerCanHit =
      !this.bossIsHit &&
      player.body.velocity.y > 80 &&
      this.isPlayerInBossStompZone();

    if (playerCanHit) {
      this.damageBoss();
      return;
    }

    if (player.y < boss.y - BOSS_CONTACT_DAMAGE_HEIGHT) {
      return;
    }

    if (!this.playerBossContactDamageArmed) {
      return;
    }

    this.playerBossContactDamageArmed = false;
    this.damagePlayer(this.level.boss.damage);
  }

  handleProjectileHit(player, projectile) {
    if (!this.bossFightActive || this.bossIntroActive || this.bossDefeated) {
      return;
    }

    const damage = projectile.getData('damage') ?? this.level.boss.damage;
    projectile.destroy();
    this.damagePlayer(damage);
  }

  damageBoss() {
    if (this.bossIsHit || this.bossDefeated) {
      return;
    }

    const hit = this.resolveHitDamage(1, PLAYER_CRIT_CHANCE);
    this.bossHp = Math.max(0, this.bossHp - hit.damage);
    this.bossIsHit = true;
    this.bossState = 'hit';
    this.boss.setVelocityX(0);
    this.player.setVelocityY(BOSS_HIT_BOUNCE);
    this.boss.play(`boss-${this.level.id}-hit`, true);
    this.alignBossToFloor();
    this.refreshHealthBars();

    if (hit.isCrit) {
      this.showCritHit();
    }

    if (this.bossHp <= 0) {
      this.time.delayedCall(260, () => this.defeatBoss());
      return;
    }

    this.time.delayedCall(BOSS_HIT_LOCK_MS, () => {
      this.bossIsHit = false;
      if (this.bossFightActive && !this.bossDefeated) {
        this.bossState = 'patrol';
      }
    });
  }

  damagePlayer(damage) {
    if (this.playerIsHit || this.isRespawning || this.bossDefeated || !this.bossFightActive) {
      return;
    }

    const hit = this.resolveHitDamage(damage, this.getBossCritChance());
    this.playerHp = Math.max(0, this.playerHp - hit.damage);
    this.playerIsHit = true;
    this.player.setVelocityX(0);
    this.player.stop();
    this.player.play(`player-hit-boss-${this.level.id}`, true);
    this.refreshHealthBars();
    this.cameras.main.shake(130, 0.003);

    if (hit.isCrit) {
      this.showCritHit();
    }

    if (this.playerHp <= 0) {
      this.time.delayedCall(PLAYER_HIT_LOCK_MS, () => this.loseBossFight());
      return;
    }

    this.time.delayedCall(PLAYER_HIT_LOCK_MS, () => {
      this.playerIsHit = false;
      this.playerState = '';
      this.configurePlayerBody();
    });
  }

  resolveHitDamage(baseDamage, critChance) {
    const isCrit = Math.random() < critChance;

    if (!isCrit) {
      return { damage: baseDamage, isCrit };
    }

    return {
      damage: Phaser.Math.Between(CRIT_DAMAGE_MIN, CRIT_DAMAGE_MAX),
      isCrit,
    };
  }

  getBossCritChance() {
    const ballCritReduction = this.levelBallsCollected * BOSS_CRIT_REDUCTION_PER_BALL;

    return Phaser.Math.Clamp(
      BOSS_CRIT_BASE_CHANCE + (this.level.id - 1) * BOSS_CRIT_CHANCE_PER_LEVEL - ballCritReduction,
      0,
      BOSS_CRIT_MAX_CHANCE,
    );
  }

  showCritHit() {
    this.critHitImage?.destroy();

    const sourceImage = this.textures.get('crit-hit').getSourceImage();
    this.critHitImage = this.add
      .image(GAME_WIDTH / 2, CRIT_HIT_Y, 'crit-hit')
      .setScrollFactor(0)
      .setDepth(149)
      .setAlpha(0)
      .setDisplaySize(
        CRIT_HIT_DISPLAY_WIDTH,
        CRIT_HIT_DISPLAY_WIDTH * (sourceImage.height / sourceImage.width),
      );
    const critHitImage = this.critHitImage;

    this.tweens.add({
      targets: critHitImage,
      alpha: 1,
      scaleX: critHitImage.scaleX * 1.08,
      scaleY: critHitImage.scaleY * 1.08,
      duration: 120,
      ease: 'Back.out',
      yoyo: true,
      hold: 340,
      onComplete: () => {
        this.tweens.add({
          targets: critHitImage,
          alpha: 0,
          duration: 180,
          onComplete: () => {
            critHitImage.destroy();

            if (this.critHitImage === critHitImage) {
              this.critHitImage = null;
            }
          },
        });
      },
    });
  }

  defeatBoss() {
    if (this.bossDefeated) {
      return;
    }

    this.bossDefeated = true;
    this.bossFightActive = false;
    this.bossIntroActive = false;
    this.bossCountdownActive = false;
    this.bossIsHit = false;
    this.bossState = 'defeated';
    this.boss.setVelocity(0, 0);
    this.boss.body.enable = false;
    this.boss.stop();
    const defeatedKey = `boss-${this.level.id}-defeated`;
    const defeatedScale = this.getBossDefeatedScale(defeatedKey);
    this.boss.setTexture(defeatedKey);
    this.boss.setScale(
      defeatedScale * (this.level.boss.defeatedScaleXMultiplier ?? 1),
      defeatedScale,
    );
    this.boss.setY(this.getBossDefeatedY(defeatedKey, defeatedScale));
    this.setHealthBarsVisible(false);
    this.hideBossSplash();
    this.removeArenaWall();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.goal.enableBody(false, this.goal.x, this.goal.y, true, true);
    this.goal.refreshBody();
    this.setArenaCamera();
    this.showToast('Boss besiegt!');
  }

  loseBossFight() {
    this.bossFightActive = false;
    this.bossIntroActive = false;
    this.bossCountdownActive = false;
    this.awaitingBossRetry = true;
    this.playerIsHit = false;
    this.playerBossContactDamageArmed = true;
    this.bossIsHit = false;
    this.bossState = 'stand';
    this.nextBossAttackAt = 0;
    this.boss.setVelocity(0, 0);
    this.boss.body.enable = true;
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    const standKey = `boss-${this.level.id}-stand`;
    this.boss.setTexture(standKey);
    this.boss.setScale(this.bossScale);
    this.boss.setPosition(this.level.boss.spawn.x, this.getBossVisualY(standKey));
    this.configureBossBody();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.hideBossSplash();
    this.setHealthBarsVisible(false);
    this.placePlayerAtBossStart();
    this.setArenaCamera();
    this.showBossRetryUi();
  }

  configureBossBody() {
    if (!this.bossBodyBounds) {
      const bounds = this.getTextureContentBounds(`boss-${this.level.id}-stand`);
      const width = bounds.width * BOSS_BODY_WIDTH_RATIO;
      const height = bounds.height * BOSS_BODY_HEIGHT_RATIO;
      this.bossBodyBounds = {
        x: bounds.x + (bounds.width - width) / 2,
        y: bounds.y + bounds.height - height + bounds.height * BOSS_BODY_VERTICAL_SHIFT_RATIO,
        width,
        height,
      };
    }

    this.boss.body.setSize(this.bossBodyBounds.width, this.bossBodyBounds.height);
    this.boss.body.setOffset(this.bossBodyBounds.x, this.bossBodyBounds.y);
  }

  getBossBodyWorldWidth() {
    if (!this.bossBodyBounds) {
      return this.boss.displayWidth;
    }

    return this.bossBodyBounds.width * this.bossScale;
  }

  clearProjectiles() {
    this.projectiles.children.each((projectile) => {
      projectile.destroy();
    });
  }

  destroyProjectile(projectile) {
    this.spawnPaintPuddleFromProjectile(projectile);
    projectile.destroy();
  }

  clearPaintPuddles() {
    this.playerSlowUntil = 0;
    this.playerJumpBlockedUntil = 0;
    this.nextPaintPuddleSpawnAt = 0;
    this.paintPuddles?.children.each((puddle) => {
      this.tweens.killTweensOf(puddle);
      puddle.destroy();
    });
  }

  setHealthBarsVisible(visible) {
    [this.playerHealthBar?.container, this.bossHealthBar?.container]
      .forEach((entry) => entry?.setVisible(visible));
  }

  refreshHealthBars() {
    this.renderSegmentedHealthBar(this.playerHealthBar, this.playerHp, this.playerMaxHp);
    this.renderSegmentedHealthBar(this.bossHealthBar, this.bossHp, this.bossMaxHp);
  }

  collectPickup(player, pickup) {
    if (!pickup.active) {
      return;
    }

    const value = pickup.getData('value') ?? 0;
    const playerHpBonus = pickup.getData('bossHpBonus') ?? 0;
    const pickupType = pickup.getData('pickupType');
    this.score += value;
    this.levelCoinHpBonus = Math.min(
      this.level.coins.length * COIN_PLAYER_HP_BONUS,
      this.levelCoinHpBonus + playerHpBonus,
    );

    if (pickupType === 'ball') {
      this.levelBallsCollected += 1;
    }

    pickup.disableBody(true, true);

    this.showToast(value >= 10 ? '+10 Bonus Ball' : '+1 Coin');
    this.refreshHud();
  }

  getPlayerBossMaxHp() {
    const roundedBonus = Math.floor(this.levelCoinHpBonus);
    const maxRoundedBonus = Math.floor(this.level.coins.length * COIN_PLAYER_HP_BONUS);

    return Phaser.Math.Clamp(
      BOSS_BASE_HP + roundedBonus,
      BOSS_BASE_HP,
      BOSS_BASE_HP + maxRoundedBonus,
    );
  }

  loseCoins(amount) {
    const coinsLost = Math.max(0, Math.min(amount, this.score));

    if (coinsLost <= 0) {
      return 0;
    }

    this.score -= coinsLost;
    this.levelCoinHpBonus = Math.max(0, this.levelCoinHpBonus - coinsLost * COIN_PLAYER_HP_BONUS);
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.refreshHealthBars();

    return coinsLost;
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
    if (this.levelComplete || !this.bossDefeated) {
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
          levelStartScore: this.score,
          highScore: this.highScore,
        });
        return;
      }

      MusicControls.stopSharedAudio(LEVEL_MUSIC_KEY);
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
    let lostCoins = 0;

    if (!isManual) {
      lostCoins = this.loseCoins(FALL_PENALTY);
      this.refreshHud();
    }

    this.player.body.reset(this.respawnPoint.x, this.respawnPoint.y);
    this.playerBossContactDamageArmed = true;
    this.playerSlowUntil = 0;
    this.playerJumpBlockedUntil = 0;
    this.player.setVelocity(0, 0);
    this.player.clearTint();
    this.playerState = 'stand';
    this.lastGroundedAt = this.time.now;
    this.player.stop();
    this.player.setTexture('char-stand');
    this.configurePlayerBody();
    this.cameras.main.shake(150, 0.004);
    this.showToast(isManual ? 'Respawn' : `Fallstrafe -${lostCoins} Coins`);

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

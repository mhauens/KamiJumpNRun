import Phaser from 'phaser';
import levelMusicMp3Url from '../../assets/shared/KamisWorldLevel.mp3';
import levelMusicOggUrl from '../../assets/shared/KamisWorldLevel.ogg';
import bossHittedSfxMp3Url from '../../assets/shared/sfx/boss_hitted.mp3';
import bossHittedSfxOggUrl from '../../assets/shared/sfx/boss_hitted.ogg';
import coinSfxMp3Url from '../../assets/shared/sfx/coin.mp3';
import coinSfxOggUrl from '../../assets/shared/sfx/coin.ogg';
import jumpSfxMp3Url from '../../assets/shared/sfx/jump.mp3';
import jumpSfxOggUrl from '../../assets/shared/sfx/jump.ogg';
import playerHittedSfxMp3Url from '../../assets/shared/sfx/player_hitted.mp3';
import playerHittedSfxOggUrl from '../../assets/shared/sfx/player_hitted.ogg';
import shotSfxMp3Url from '../../assets/shared/sfx/shot.mp3';
import shotSfxOggUrl from '../../assets/shared/sfx/shot.ogg';
import {
  getBossRuntimeAtlasKeys,
  loadBossAssetsForLevel,
} from '../data/bossAssets.js';
import { BOSS_SPLASH_AUDIO } from '../data/bossSplashAudio.js';
import { getLevel, getLevelCount, subscribeLevelDataUpdates } from '../data/levelStore.js';
import { getNextRetrySoundConfig, rememberRetrySoundPlayback } from '../data/retrySounds.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';
import {
  createRuntimeSpriteAtlas,
  getAnimationFrame,
  getLogicalTextureKey,
  getTextureArgs,
  setSpriteTexture,
} from '../game/spriteAtlas.js';
import { MusicControls } from '../ui/MusicControls.js';
import {
  AUDIO_CHANNELS,
  getAudioChannelVolume,
  subscribeAudioSettings,
} from '../utils/audioSettings.js';
import { FullscreenButton } from '../ui/FullscreenButton.js';
import { readGamepadInput, refreshGamepads } from '../utils/gamepad.js';
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
const TOUCH_CONTROLS_DEPTH = 130;
const TOUCH_CONTROLS_IDLE_ALPHA = 0.56;
const TOUCH_CONTROLS_ACTIVE_ALPHA = 0.88;
const TOUCH_STICK_X = 158;
const TOUCH_STICK_Y = GAME_HEIGHT - 124;
const TOUCH_STICK_BASE_RADIUS = 74;
const TOUCH_STICK_THUMB_RADIUS = 34;
const TOUCH_STICK_HIT_RADIUS = 118;
const TOUCH_STICK_MAX_DISTANCE = 58;
const TOUCH_STICK_DEADZONE = 22;
const TOUCH_JUMP_X = GAME_WIDTH - 134;
const TOUCH_JUMP_Y = GAME_HEIGHT - 124;
const TOUCH_JUMP_RADIUS = 68;
const TOUCH_JUMP_HIT_RADIUS = 90;
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
const BOSS_DODGE_EDGE_MARGIN = 90;
const BOSS_DODGE_MIN_SPACE = 150;
const BOSS_DODGE_ANIMATION_TIME_SCALE = 2.2;
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
const BOSS_SHIELD_BAR_Y = HEALTH_BAR_BAR_Y + HEALTH_BAR_HEIGHT + 6;
const BOSS_SHIELD_BAR_HEIGHT = 7;
const BOSS_SHIELD_MAX_RATIO = 0.5;
const PLAYER_ARENA_FOOT_SINK = 30;
const CHECKPOINT_TRIGGER_WIDTH = 72;
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
const LEVEL_MUSIC_PANEL_WIDTH = 424;
const LEVEL_MUSIC_PANEL_MARGIN = 34;
const FULLSCREEN_BUTTON_GAP = 10;
const COIN_SFX_KEY = 'coin-pickup-sfx';
const COIN_SFX_VOLUME = 0.65;
const JUMP_SFX_KEY = 'jump-sfx';
const JUMP_SFX_VOLUME = 0.6;
const BOSS_SHOT_SFX_KEY = 'boss-shot-sfx';
const BOSS_SHOT_SFX_VOLUME = 0.55;
const PLAYER_HITTED_SFX_KEY = 'player-hitted-sfx';
const PLAYER_HITTED_SFX_VOLUME = 0.7;
const BOSS_HITTED_SFX_KEY = 'boss-hitted-sfx';
const BOSS_HITTED_SFX_VOLUME = 0.7;
const BOSS_SPECIAL_ATTACK_REDUCTION_PER_BALL = 0.02;
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
const PAINT_PUDDLE_SPAWN_COOLDOWN_MS = 5000;
const PAINT_PUDDLE_CONTENT_ALPHA_THRESHOLD = 128;
const PAINT_PUDDLE_STEP_TOLERANCE = 18;
const PAINT_PUDDLE_STEP_HORIZONTAL_INSET = 10;
const TREE_ATTACK_ANIMATION_KEY = 'tree-hit';
const TREE_DISPLAY_HEIGHT = 175;
const TREE_FOOT_SINK = 18;
const TREE_NORMAL_ATTACK_CHANCE = 0.45;
const TREE_NORMAL_COIN_PENALTY = 1;
const TREE_BOSS_ATTACK_CHANCE = 0.65;
const TREE_NORMAL_COUNT = 3;
const TREE_NORMAL_MIN_PLATFORM_WIDTH = 220;
const TREE_NORMAL_START_PADDING = 220;
const TREE_NORMAL_BOSS_PADDING = 220;
const TREE_BOSS_DAMAGE = 1;
const TREE_BOSS_MAX_ACTIVE = 2;
const TREE_BOSS_SPAWN_INITIAL_DELAY_MS = 1500;
const TREE_BOSS_SPAWN_MIN_DELAY_MS = 3400;
const TREE_BOSS_SPAWN_MAX_DELAY_MS = 5600;
const TREE_BOSS_LIFETIME_MS = 8000;
const TREE_BOSS_FADE_MS = 280;
const TREE_BOSS_ARENA_MARGIN = 170;
const TREE_BOSS_PLAYER_MIN_OFFSET = 190;
const TREE_BOSS_PLAYER_MAX_OFFSET = 360;
const TREE_BOSS_PLAYER_SAFE_DISTANCE = 240;
const CARD_SPREAD_BOSS_ID = 3;
const CARD_SPREAD_ATTACK_CHANCE = 0.28;
const CARD_SPREAD_MIN_PROJECTILES = 3;
const CARD_SPREAD_MAX_PROJECTILES = 5;
const CARD_SPREAD_VERTICAL_SPEED_STEP = 70;
const CHARGE_ATTACK_BOSS_ID = 5;
const CHARGE_ATTACK_CHANCE = CARD_SPREAD_ATTACK_CHANCE;
const CHARGE_ATTACK_SPEED = 760;
const CHARGE_ATTACK_WINDUP_MS = 180;
const CHARGE_ATTACK_MAX_MS = 1050;
const CHARGE_ATTACK_MAX_DISTANCE = 680;
const PHASE_TWO_BOSS_ID = 6;
const PHASE_TWO_SPECIAL_ATTACK_DAMAGE = 3;
const RETRY_RESTART_OPTION = 0;
const RETRY_RETRY_OPTION = 1;

export class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.levelStartScore = data.levelStartScore ?? this.score;
    this.highScore = data.highScore ?? loadHighScore();
    this.level = getLevel(this.levelIndex);
    if (!this.level) {
      this.levelIndex = 0;
      this.level = getLevel(this.levelIndex);
    }
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
    this.bossPhase = 1;
    this.bossShieldMax = 0;
    this.bossShieldHp = 0;
    this.nextBossAttackAt = 0;
    this.nextBossContactDamageAt = 0;
    this.bossDirection = -1;
    this.bossScale = 1;
    this.bossBottomPaddingByTexture = new Map();
    this.bossBodyBounds = null;
    this.playerSlowUntil = 0;
    this.playerJumpBlockedUntil = 0;
    this.nextBossTreeSpawnAt = 0;
    this.nextPaintPuddleSpawnAt = 0;
    this.bossChargeStartedAt = 0;
    this.bossChargeStartX = 0;
    this.bossChargeDirection = -1;
    this.bossDodgeStartedAt = 0;
    this.bossDodgeDirection = -1;
    this.nextBossDodgeAt = 0;
    this.gamepadButtons = {};
    this.gamepadInput = null;
    this.touchInput = this.createTouchInputState();
    this.touchControlElements = [];
    this.touchControlsVisible = false;
    this.touchControlsSuppressedByHardwareInput = false;
    this.retrySelectionIndex = RETRY_RETRY_OPTION;
    this.lastBossSplashAudioKeyByPhase = {};
    this.activeRetrySound = null;
    this.bossSplashSoundPool = new Map();
    this.unsubscribeLevelDataUpdates = null;
    this.unsubscribeAudioSettings = null;
  }

  preload() {
    this.loadSfxAudio();
    loadBossAssetsForLevel(this, this.level.id);
    this.loadBossSplashAudioForCurrentLevel();
  }

  createTouchInputState() {
    return {
      left: false,
      right: false,
      jumpJustPressed: false,
      stickPointerId: null,
      jumpPointerId: null,
    };
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopBossSplashSound();
      this.stopRetrySound();
      this.destroyTouchControls();
      this.destroyBossSplashSoundPool();
      this.unsubscribeLevelDataUpdates?.();
      this.unsubscribeAudioSettings?.();
    });
    this.watchDevLevelData();
    this.watchAudioSettings();
    this.configureLoadedBossTextures();
    this.createLevelBossRuntimeAtlas();
    this.createBossSplashSoundPool();

    this.createWorld();
    this.createPlatforms();
    this.createPlayer();
    this.createCollectibles();
    this.createCheckpoints();
    this.createGoal();
    this.createBoss();
    this.createTrees();
    this.createHud();
    this.createBossRetryUi();
    this.createLevelMusicControls();
    this.createFullscreenButton();
    this.createTouchControls();
    this.configureCollisions();
    this.configureCamera();
    refreshGamepads(this);
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

  createFullscreenButton() {
    this.fullscreenButton = new FullscreenButton(this, {
      x: GAME_WIDTH -
        LEVEL_MUSIC_PANEL_MARGIN -
        FullscreenButton.size * 2 -
        FULLSCREEN_BUTTON_GAP,
      y: LEVEL_MUSIC_PANEL_MARGIN + 4,
      depth: 181,
    });
    this.fullscreenButton.start();
  }

  createTouchControls() {
    if (!this.supportsTouchControls()) {
      return;
    }

    this.touchInput = this.createTouchInputState();
    this.touchControlElements = [];

    this.touchStickBase = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH)
      .setAlpha(TOUCH_CONTROLS_IDLE_ALPHA);
    this.drawTouchStickBase(this.touchStickBase);

    this.touchStickThumb = this.add.graphics()
      .setPosition(TOUCH_STICK_X, TOUCH_STICK_Y)
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH + 1)
      .setAlpha(TOUCH_CONTROLS_IDLE_ALPHA);
    this.drawTouchStickThumb(this.touchStickThumb);

    this.touchStickZone = this.add
      .zone(
        TOUCH_STICK_X,
        TOUCH_STICK_Y,
        TOUCH_STICK_HIT_RADIUS * 2,
        TOUCH_STICK_HIT_RADIUS * 2,
      )
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH + 2)
      .setInteractive(
        new Phaser.Geom.Circle(
          TOUCH_STICK_HIT_RADIUS,
          TOUCH_STICK_HIT_RADIUS,
          TOUCH_STICK_HIT_RADIUS,
        ),
        Phaser.Geom.Circle.Contains,
      );

    this.touchJumpBase = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH)
      .setAlpha(TOUCH_CONTROLS_IDLE_ALPHA);
    this.drawTouchJumpButton(this.touchJumpBase);

    this.touchJumpIcon = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH + 1)
      .setAlpha(TOUCH_CONTROLS_IDLE_ALPHA);
    this.drawTouchJumpIcon(this.touchJumpIcon);

    this.touchJumpZone = this.add
      .zone(
        TOUCH_JUMP_X,
        TOUCH_JUMP_Y,
        TOUCH_JUMP_HIT_RADIUS * 2,
        TOUCH_JUMP_HIT_RADIUS * 2,
      )
      .setScrollFactor(0)
      .setDepth(TOUCH_CONTROLS_DEPTH + 2)
      .setInteractive(
        new Phaser.Geom.Circle(
          TOUCH_JUMP_HIT_RADIUS,
          TOUCH_JUMP_HIT_RADIUS,
          TOUCH_JUMP_HIT_RADIUS,
        ),
        Phaser.Geom.Circle.Contains,
      );

    this.touchControlElements.push(
      this.touchStickBase,
      this.touchStickThumb,
      this.touchStickZone,
      this.touchJumpBase,
      this.touchJumpIcon,
      this.touchJumpZone,
    );

    this.touchStickZone.on('pointerdown', this.handleTouchStickDown, this);
    this.touchJumpZone.on('pointerdown', this.handleTouchJumpDown, this);

    this.touchPointerMoveHandler = (pointer) => this.handleTouchPointerMove(pointer);
    this.touchPointerUpHandler = (pointer) => this.handleTouchPointerUp(pointer);
    this.touchPointerDownHandler = (pointer) => this.handleGlobalTouchPointerDown(pointer);
    this.clearTouchPointerHandler = () => this.clearTouchInput();

    this.input.on('pointerdown', this.touchPointerDownHandler);
    this.input.on('pointermove', this.touchPointerMoveHandler);
    this.input.on('pointerup', this.touchPointerUpHandler);
    this.input.on('pointerupoutside', this.touchPointerUpHandler);
    this.input.on('gameout', this.clearTouchPointerHandler);

    this.setTouchControlsVisible(this.shouldShowTouchControls());
  }

  supportsTouchControls() {
    const maxTouchPoints = typeof navigator !== 'undefined'
      ? navigator.maxTouchPoints ?? 0
      : 0;

    return maxTouchPoints > 0 || Boolean(this.sys.game.device.input.touch);
  }

  shouldShowTouchControls() {
    return this.supportsTouchControls() &&
      !this.touchControlsSuppressedByHardwareInput &&
      !this.levelComplete &&
      !this.awaitingBossRetry &&
      !this.bossIntroActive &&
      !this.bossCountdownActive;
  }

  drawTouchStickBase(graphics) {
    graphics.clear();
    graphics.fillStyle(0x07182b, 0.44);
    graphics.fillCircle(TOUCH_STICK_X, TOUCH_STICK_Y, TOUCH_STICK_BASE_RADIUS);
    graphics.lineStyle(4, 0xffffff, 0.54);
    graphics.strokeCircle(TOUCH_STICK_X, TOUCH_STICK_Y, TOUCH_STICK_BASE_RADIUS);
    graphics.lineStyle(2, 0x9ce7ff, 0.65);
    graphics.strokeCircle(TOUCH_STICK_X, TOUCH_STICK_Y, TOUCH_STICK_BASE_RADIUS - 15);
  }

  drawTouchStickThumb(graphics) {
    graphics.clear();
    graphics.fillStyle(0xffffff, 0.78);
    graphics.fillCircle(0, 0, TOUCH_STICK_THUMB_RADIUS);
    graphics.fillStyle(0x7ed2ff, 0.28);
    graphics.fillCircle(0, 0, TOUCH_STICK_THUMB_RADIUS - 10);
    graphics.lineStyle(3, 0x07182b, 0.36);
    graphics.strokeCircle(0, 0, TOUCH_STICK_THUMB_RADIUS);
  }

  drawTouchJumpButton(graphics) {
    graphics.clear();
    graphics.fillStyle(0x07182b, 0.44);
    graphics.fillCircle(TOUCH_JUMP_X, TOUCH_JUMP_Y, TOUCH_JUMP_RADIUS);
    graphics.lineStyle(4, 0xffffff, 0.54);
    graphics.strokeCircle(TOUCH_JUMP_X, TOUCH_JUMP_Y, TOUCH_JUMP_RADIUS);
    graphics.fillStyle(0xffef98, 0.2);
    graphics.fillCircle(TOUCH_JUMP_X, TOUCH_JUMP_Y, TOUCH_JUMP_RADIUS - 18);
  }

  drawTouchJumpIcon(graphics) {
    graphics.clear();
    graphics.lineStyle(9, 0xffffff, 0.86);
    graphics.beginPath();
    graphics.moveTo(TOUCH_JUMP_X - 28, TOUCH_JUMP_Y + 8);
    graphics.lineTo(TOUCH_JUMP_X, TOUCH_JUMP_Y - 26);
    graphics.lineTo(TOUCH_JUMP_X + 28, TOUCH_JUMP_Y + 8);
    graphics.strokePath();
    graphics.lineBetween(TOUCH_JUMP_X, TOUCH_JUMP_Y - 22, TOUCH_JUMP_X, TOUCH_JUMP_Y + 32);
  }

  handleTouchStickDown(pointer, localX, localY, event) {
    event?.stopPropagation();

    if (!this.touchInput || this.touchInput.stickPointerId !== null) {
      return;
    }

    this.touchInput.stickPointerId = pointer.id;
    this.setTouchStickActive(true);
    this.updateTouchStickFromPointer(pointer);
  }

  handleTouchJumpDown(pointer, localX, localY, event) {
    event?.stopPropagation();

    if (!this.touchInput || this.touchInput.jumpPointerId !== null) {
      return;
    }

    this.touchInput.jumpPointerId = pointer.id;
    this.touchInput.jumpJustPressed = true;
    this.setTouchJumpActive(true);
  }

  handleGlobalTouchPointerDown(pointer) {
    if (this.isTouchPointer(pointer)) {
      this.setTouchControlsSuppressedByHardwareInput(false);
    }
  }

  isTouchPointer(pointer) {
    return pointer?.event?.pointerType === 'touch' ||
      pointer?.event?.type?.startsWith('touch');
  }

  handleTouchPointerMove(pointer) {
    if (!this.touchInput || pointer.id !== this.touchInput.stickPointerId) {
      return;
    }

    this.updateTouchStickFromPointer(pointer);
  }

  handleTouchPointerUp(pointer) {
    if (!this.touchInput) {
      return;
    }

    if (pointer.id === this.touchInput.stickPointerId) {
      this.touchInput.stickPointerId = null;
      this.touchInput.left = false;
      this.touchInput.right = false;
      this.touchStickThumb?.setPosition(TOUCH_STICK_X, TOUCH_STICK_Y);
      this.setTouchStickActive(false);
    }

    if (pointer.id === this.touchInput.jumpPointerId) {
      this.touchInput.jumpPointerId = null;
      this.setTouchJumpActive(false);
    }
  }

  updateTouchStickFromPointer(pointer) {
    const deltaX = pointer.x - TOUCH_STICK_X;
    const deltaY = pointer.y - TOUCH_STICK_Y;
    const distance = Math.min(
      TOUCH_STICK_MAX_DISTANCE,
      Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    );
    const angle = Math.atan2(deltaY, deltaX);
    const thumbX = distance > 0 ? Math.cos(angle) * distance : 0;
    const thumbY = distance > 0 ? Math.sin(angle) * distance : 0;

    this.touchStickThumb?.setPosition(TOUCH_STICK_X + thumbX, TOUCH_STICK_Y + thumbY);
    this.touchInput.left = thumbX < -TOUCH_STICK_DEADZONE;
    this.touchInput.right = thumbX > TOUCH_STICK_DEADZONE;
  }

  setTouchStickActive(active) {
    const alpha = active ? TOUCH_CONTROLS_ACTIVE_ALPHA : TOUCH_CONTROLS_IDLE_ALPHA;

    this.touchStickBase?.setAlpha(alpha);
    this.touchStickThumb?.setAlpha(alpha);
  }

  setTouchJumpActive(active) {
    const alpha = active ? TOUCH_CONTROLS_ACTIVE_ALPHA : TOUCH_CONTROLS_IDLE_ALPHA;

    this.touchJumpBase?.setAlpha(alpha);
    this.touchJumpIcon?.setAlpha(alpha);
  }

  clearTouchInput() {
    this.touchInput = this.createTouchInputState();
    this.touchStickThumb?.setPosition(TOUCH_STICK_X, TOUCH_STICK_Y);
    this.setTouchStickActive(false);
    this.setTouchJumpActive(false);
  }

  setTouchControlsVisible(visible) {
    if (!this.touchControlElements?.length || this.touchControlsVisible === visible) {
      return;
    }

    this.touchControlsVisible = visible;
    this.touchControlElements.forEach((element) => {
      element.setVisible(visible);

      if (element.input) {
        element.input.enabled = visible;
      }
    });

    if (!visible) {
      this.clearTouchInput();
    }
  }

  updateTouchControlsVisibility() {
    if (!this.touchControlElements?.length) {
      return;
    }

    this.setTouchControlsVisible(this.shouldShowTouchControls());
  }

  setTouchControlsSuppressedByHardwareInput(suppressed) {
    if (this.touchControlsSuppressedByHardwareInput === suppressed) {
      return;
    }

    this.touchControlsSuppressedByHardwareInput = suppressed;
    this.updateTouchControlsVisibility();
  }

  suppressTouchControlsForKeyboardInput() {
    if (!this.supportsTouchControls()) {
      return;
    }

    this.setTouchControlsSuppressedByHardwareInput(true);
  }

  consumeTouchJumpPress() {
    const jumpJustPressed = Boolean(this.touchInput?.jumpJustPressed);

    if (this.touchInput) {
      this.touchInput.jumpJustPressed = false;
    }

    return jumpJustPressed;
  }

  destroyTouchControls() {
    if (this.touchStickZone) {
      this.touchStickZone.off('pointerdown', this.handleTouchStickDown, this);
    }

    if (this.touchJumpZone) {
      this.touchJumpZone.off('pointerdown', this.handleTouchJumpDown, this);
    }

    if (this.touchPointerMoveHandler) {
      this.input.off('pointermove', this.touchPointerMoveHandler);
    }

    if (this.touchPointerDownHandler) {
      this.input.off('pointerdown', this.touchPointerDownHandler);
    }

    if (this.touchPointerUpHandler) {
      this.input.off('pointerup', this.touchPointerUpHandler);
      this.input.off('pointerupoutside', this.touchPointerUpHandler);
    }

    if (this.clearTouchPointerHandler) {
      this.input.off('gameout', this.clearTouchPointerHandler);
    }

    this.touchControlElements = [];
    this.touchPointerDownHandler = null;
    this.touchPointerMoveHandler = null;
    this.touchPointerUpHandler = null;
    this.clearTouchPointerHandler = null;
  }

  loadBossSplashAudioForCurrentLevel() {
    Object.values(BOSS_SPLASH_AUDIO[this.level.id] ?? {})
      .flat()
      .forEach((config) => {
        if (!config.key || this.cache.audio.exists(config.key)) {
          return;
        }

        this.load.audio(config.key, config.urls);
      });
  }

  loadSfxAudio() {
    if (!this.cache.audio.exists(COIN_SFX_KEY)) {
      this.load.audio(COIN_SFX_KEY, [coinSfxOggUrl, coinSfxMp3Url]);
    }

    if (!this.cache.audio.exists(JUMP_SFX_KEY)) {
      this.load.audio(JUMP_SFX_KEY, [jumpSfxOggUrl, jumpSfxMp3Url]);
    }

    if (!this.cache.audio.exists(BOSS_SHOT_SFX_KEY)) {
      this.load.audio(BOSS_SHOT_SFX_KEY, [shotSfxOggUrl, shotSfxMp3Url]);
    }

    if (!this.cache.audio.exists(PLAYER_HITTED_SFX_KEY)) {
      this.load.audio(PLAYER_HITTED_SFX_KEY, [playerHittedSfxOggUrl, playerHittedSfxMp3Url]);
    }

    if (!this.cache.audio.exists(BOSS_HITTED_SFX_KEY)) {
      this.load.audio(BOSS_HITTED_SFX_KEY, [bossHittedSfxOggUrl, bossHittedSfxMp3Url]);
    }
  }

  createBossSplashSoundPool() {
    Object.values(BOSS_SPLASH_AUDIO[this.level.id] ?? {})
      .flat()
      .forEach((config) => {
        if (
          !config.key ||
          this.bossSplashSoundPool.has(config.key) ||
          !this.cache.audio.exists(config.key)
        ) {
          return;
        }

        const configVolume = config.volume ?? 1;
        const sound = this.sound.add(config.key, {
          volume: configVolume * 0.5 * getAudioChannelVolume(AUDIO_CHANNELS.voice),
        });

        sound.once(Phaser.Sound.Events.DESTROY, () => {
          if (this.bossSplashSoundPool.get(config.key)?.sound === sound) {
            this.bossSplashSoundPool.delete(config.key);
          }
        });

        this.bossSplashSoundPool.set(config.key, {
          sound,
          configVolume,
        });
      });
  }

  destroyBossSplashSoundPool() {
    this.bossSplashSoundPool.forEach(({ sound }) => {
      if (sound.isPlaying || sound.isPaused) {
        sound.stop();
      }

      sound.destroy();
    });
    this.bossSplashSoundPool.clear();
  }

  configureLoadedBossTextures() {
    [
      this.getBossKey('splashscreen'),
      this.getBossKey('retry-splashscreen'),
      `boss-${this.level.id}-2-splashscreen`,
      `boss-${this.level.id}-2-retry-splashscreen`,
    ].forEach((textureKey) => {
      if (!this.textures.exists(textureKey)) {
        return;
      }

      this.textures
        .get(textureKey)
        .setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
  }

  createLevelBossRuntimeAtlas() {
    createRuntimeSpriteAtlas(this, getBossRuntimeAtlasKeys(this.level.id), { reset: false });
  }

  watchDevLevelData() {
    if (!import.meta.env.DEV) {
      return;
    }

    this.unsubscribeLevelDataUpdates = subscribeLevelDataUpdates(() => {
      const nextLevel = getLevel(this.levelIndex);

      if (!nextLevel) {
        return;
      }

      this.scene.restart({
        levelIndex: this.levelIndex,
        score: this.levelStartScore,
        levelStartScore: this.levelStartScore,
        highScore: this.highScore,
      });
    });
  }

  watchAudioSettings() {
    this.unsubscribeAudioSettings = subscribeAudioSettings(() => {
      this.applyVoiceVolumes();
    });
  }

  applyVoiceVolumes() {
    const voiceVolume = getAudioChannelVolume(AUDIO_CHANNELS.voice);

    this.bossSplashSoundPool.forEach(({ sound, configVolume }) => {
      sound.setVolume(configVolume * 0.5 * voiceVolume);
    });
    this.activeBossSplashSound?.sound?.setVolume(
      (this.activeBossSplashSound.configVolume ?? 1) * 0.5 * voiceVolume,
    );
    this.activeRetrySound?.setVolume(0.5 * voiceVolume);
  }

  ensureBossAnimations() {
    this.scene.get('BootScene')?.createBossAnimations(this.level.id, this.bossPhase);
  }

  getBossKey(kind) {
    const phaseSuffix = this.bossPhase === 2 ? '-2' : '';

    return `boss-${this.level.id}${phaseSuffix}-${kind}`;
  }

  getPlayerHitBossKey() {
    const phaseSuffix = this.bossPhase === 2 ? '-2' : '';

    return `player-hit-boss-${this.level.id}${phaseSuffix}`;
  }

  hasBossPhaseTwo() {
    return this.level.id === PHASE_TWO_BOSS_ID && Boolean(this.level.boss.phase2);
  }

  getBossConfig() {
    const phaseOverrides = this.bossPhase === 2 &&
      typeof this.level.boss.phase2 === 'object'
      ? this.level.boss.phase2
      : {};

    return {
      ...this.level.boss,
      ...phaseOverrides,
    };
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
      .sprite(this.respawnPoint.x, this.respawnPoint.y, ...getTextureArgs('char-stand'))
      .setOrigin(0.5, 1)
      .setScale(PLAYER_SCALE)
      .setCollideWorldBounds(true)
      .setDepth(10);
    this.player.setData('logicalTextureKey', 'char-stand');

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
      frames: Array.from({ length: 8 }, (_, index) => getAnimationFrame(`char-walk-${index + 1}`)),
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
        .create(entry.x, entry.y, ...getTextureArgs(texture))
        .setScale(scale)
        .setDepth(8);

      pickup.setData('logicalTextureKey', texture);
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
        ...getTextureArgs('checkpoint'),
      );

      checkpoint
        .setOrigin(0.5, 1)
        .setDepth(7)
        .setData('spawn', this.resolveRespawnPoint(entry))
        .setData('label', entry.label)
        .setData('activated', false)
        .setTint(index === 0 ? 0xffb39d : 0xffffff);
      checkpoint.setData('logicalTextureKey', 'checkpoint');

      checkpoint.refreshBody();
      checkpoint.body.setSize(CHECKPOINT_TRIGGER_WIDTH, GAME_HEIGHT);
      checkpoint.body.setOffset(
        checkpoint.displayOriginX - CHECKPOINT_TRIGGER_WIDTH / 2,
        -entry.y,
      );
    });
  }

  createGoal() {
    this.goal = this.physics.add.staticImage(
      this.level.goal.x,
      this.level.goal.y + this.level.goal.height,
      ...getTextureArgs('goal'),
    );
    this.goal.setData('logicalTextureKey', 'goal');

    this.goal
      .setOrigin(0.5, 1)
      .setDisplaySize(this.level.goal.width, this.level.goal.height)
      .setDepth(7)
      .refreshBody();

    this.goal.disableBody(true, true);
  }

  createBoss() {
    const bossConfig = this.getBossConfig();
    const standKey = this.getBossKey('stand');
    this.bossScale = this.resolveBossScale(standKey);

    this.boss = this.physics.add
      .sprite(bossConfig.spawn.x, this.getBossVisualY(standKey), ...getTextureArgs(standKey))
      .setOrigin(0.5, 1)
      .setScale(this.bossScale)
      .setCollideWorldBounds(false)
      .setDepth(9);
    this.boss.setData('logicalTextureKey', standKey);

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

  createTrees() {
    this.trees = this.physics.add.staticGroup();

    this.getNormalTreeEntries().forEach((entry) => {
      this.createTree(entry.x, entry.y, {
        attackChance: entry.attackChance ?? TREE_NORMAL_ATTACK_CHANCE,
        bossTree: false,
      });
    });
  }

  getNormalTreeEntries() {
    if (Array.isArray(this.level.trees) && this.level.trees.length > 0) {
      return this.level.trees.map((entry) => ({
        ...entry,
        y: entry.y ?? this.getPlatformTopAt(entry.x) ?? this.level.spawn.y,
      }));
    }

    const maxTreeX = this.level.boss.triggerX - TREE_NORMAL_BOSS_PADDING;
    const usablePlatforms = this.level.platforms
      .filter((platform) => (
        platform.width >= TREE_NORMAL_MIN_PLATFORM_WIDTH &&
        platform.height > PLATFORM_SURFACE_HEIGHT &&
        platform.x + platform.width > TREE_NORMAL_START_PADDING &&
        platform.x < maxTreeX
      ))
      .sort((left, right) => left.x - right.x);

    if (usablePlatforms.length === 0) {
      return [];
    }

    const step = usablePlatforms.length / (TREE_NORMAL_COUNT + 1);

    return Array.from({ length: TREE_NORMAL_COUNT }, (_, index) => {
      const platformIndex = Phaser.Math.Clamp(
        Math.round(step * (index + 1) - 0.5),
        0,
        usablePlatforms.length - 1,
      );
      const platform = usablePlatforms[platformIndex];
      const x = Phaser.Math.Clamp(
        platform.x + platform.width * (index % 2 === 0 ? 0.62 : 0.38),
        platform.x + 70,
        platform.x + platform.width - 70,
      );

      return {
        x,
        y: platform.y,
        attackChance: TREE_NORMAL_ATTACK_CHANCE,
      };
    });
  }

  createTree(x, platformTop, { attackChance, bossTree }) {
    const source = this.textures.get('tree').getSourceImage();
    const displayWidth = source.width * (TREE_DISPLAY_HEIGHT / source.height);
    const tree = this.trees
      .create(x, platformTop + TREE_FOOT_SINK, ...getTextureArgs('tree'))
      .setOrigin(0.5, 1)
      .setDisplaySize(displayWidth, TREE_DISPLAY_HEIGHT)
      .setDepth(bossTree ? 8 : 5);

    tree
      .setData('logicalTextureKey', 'tree')
      .setData('attackChance', attackChance)
      .setData('bossTree', bossTree)
      .setData('checked', false)
      .setData('attacking', false);
    tree.refreshBody();

    return tree;
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
      .text(HUD_TEXT_X, 108, 'A/D, Pfeile, Stick, D-Pad oder Touch bewegen  Space/A/Touch springt  R/Start respawn', {
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

    this.bossHealthBar.shield = this.add.graphics().setScrollFactor(0).setVisible(false);
    this.bossHealthBar.valueText.setY(HEALTH_BAR_VALUE_Y + 10);
    this.bossHealthBar.container.add(this.bossHealthBar.shield);
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

  renderBossShieldBar() {
    const shield = this.bossHealthBar?.shield;

    if (!shield) {
      return;
    }

    shield.clear();
    shield.setVisible(this.bossPhase === 2 && this.bossShieldMax > 0);

    if (!shield.visible) {
      return;
    }

    const progress = Phaser.Math.Clamp(this.bossShieldHp / this.bossShieldMax, 0, 1);
    const filledWidth = Math.round((HEALTH_BAR_WIDTH - 4) * progress);

    shield.fillStyle(0x061323, 1);
    shield.fillRect(HEALTH_BAR_SEGMENT_X, BOSS_SHIELD_BAR_Y, HEALTH_BAR_WIDTH, BOSS_SHIELD_BAR_HEIGHT);
    shield.fillStyle(0x1f4f7a, 1);
    shield.fillRect(
      HEALTH_BAR_SEGMENT_X + 2,
      BOSS_SHIELD_BAR_Y + 2,
      HEALTH_BAR_WIDTH - 4,
      BOSS_SHIELD_BAR_HEIGHT - 3,
    );

    if (filledWidth <= 0) {
      return;
    }

    shield.fillStyle(0x2f9dff, 1);
    shield.fillRect(
      HEALTH_BAR_SEGMENT_X + 2,
      BOSS_SHIELD_BAR_Y + 2,
      filledWidth,
      BOSS_SHIELD_BAR_HEIGHT - 3,
    );
    shield.fillStyle(0xbfe7ff, 0.95);
    shield.fillRect(HEALTH_BAR_SEGMENT_X + 2, BOSS_SHIELD_BAR_Y + 2, filledWidth, 1);
  }

  createBossRetryUi() {
    this.retrySplash = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.getBossKey('retry-splashscreen'))
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

    this.restartLevelButton.on('pointerdown', () => this.restartCurrentLevel());

    this.retryButton.on('pointerdown', () => this.retryBossFight());

    this.retrySelectionMarker = this.add
      .text(GAME_WIDTH / 2 - 238, GAME_HEIGHT - 188, '>', {
        fontFamily: 'Arial, Verdana, sans-serif',
        fontSize: '58px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#17324d',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(153)
      .setVisible(false);

    this.retryControllerHelpText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 286, 'Controller: Hoch/Runter waehlen  A bestaetigt', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#17324d',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(153)
      .setVisible(false);
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
    this.retrySplash.setTexture(this.getBossKey('retry-splashscreen'));
    this.fitImageToScreen(this.retrySplash);
    this.retrySplash.setVisible(true);
    this.restartLevelButton.setVisible(true);
    this.retryButton.setVisible(true);
    this.retrySelectionIndex = RETRY_RETRY_OPTION;
    this.updateBossRetrySelectionUi();
    this.updateLevelMusicPause();
    this.playRetrySound();
  }

  hideBossRetryUi() {
    this.stopBossSplashSound();
    this.stopRetrySound();
    this.retrySplash?.setVisible(false);
    this.restartLevelButton?.setVisible(false);
    this.restartLevelButton?.setScale(1);
    this.retryButton?.setVisible(false);
    this.retryButton?.setScale(1);
    this.retrySelectionMarker?.setVisible(false);
    this.retryControllerHelpText?.setVisible(false);
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
    this.physics.add.overlap(
      this.player,
      this.trees,
      this.handleTreeOverlap,
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
    this.updateTouchControlsVisibility();
    this.gamepadInput = readGamepadInput(this, this.gamepadButtons);
    this.gamepadButtons = this.gamepadInput.buttons;

    if (this.levelComplete) {
      this.player.setVelocityX(0);
      return;
    }

    if (this.awaitingBossRetry) {
      this.handleBossRetryInput();
      return;
    }

    const keyboardRestartPressed = Phaser.Input.Keyboard.JustDown(this.keys.restart);

    if (keyboardRestartPressed) {
      this.suppressTouchControlsForKeyboardInput();
    }

    if (keyboardRestartPressed || this.gamepadInput.restartJustPressed) {
      this.respawnPlayer(true);
      return;
    }

    this.updateBossTrigger();
    this.updateBossExit();
    this.handleMovement();
    this.checkBossStomp();
    this.updateBoss();
    this.updateProjectiles();
    this.updateTrees();
    this.updateBossTrees();
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
      this.consumeTouchJumpPress();
      return;
    }

    const groundedNow =
      body.blocked.down || body.touching.down || body.wasTouching.down;
    const jumpBlocked = this.isPlayerJumpBlocked();
    const canJump = !jumpBlocked &&
      (groundedNow || this.time.now - this.lastGroundedAt <= GROUNDED_GRACE_MS);
    let jumpedThisFrame = false;

    const keyboardLeft = this.keys.left.isDown || this.keys.leftArrow.isDown;
    const keyboardRight = this.keys.right.isDown || this.keys.rightArrow.isDown;
    const keyboardJumpJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump);

    if (keyboardLeft || keyboardRight || keyboardJumpJustPressed) {
      this.suppressTouchControlsForKeyboardInput();
    }

    const movingLeft = keyboardLeft ||
      this.gamepadInput?.left ||
      this.touchInput?.left;
    const movingRight = keyboardRight ||
      this.gamepadInput?.right ||
      this.touchInput?.right;
    const touchJumpJustPressed = this.consumeTouchJumpPress();

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

    if ((
      keyboardJumpJustPressed ||
      this.gamepadInput?.actionJustPressed ||
      touchJumpJustPressed
    ) && canJump) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.playJumpSfx();
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
      setSpriteTexture(this.player, nextState === 'jump' ? 'char-jump' : 'char-stand');
    }

    this.configurePlayerBody();
  }

  startBossIntro() {
    this.bossIntroActive = true;
    this.bossIntroShown = true;
    this.bossState = 'intro';
    this.placeBossFightCharactersAtStart();
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
    this.placeBossFightCharactersAtStart();
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
    this.clearBossTrees();
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    if (this.bossPhase === 2) {
      this.bossShieldMax = Math.ceil(this.bossMaxHp * BOSS_SHIELD_MAX_RATIO);
      this.bossShieldHp = this.bossShieldMax;
    } else {
      this.bossShieldMax = 0;
      this.bossShieldHp = 0;
    }
    this.placeBossFightCharactersAtStart();
    this.activateBossCheckpoint();
    this.createArenaWall();
    this.nextBossAttackAt = this.time.now + 700;
    this.nextBossContactDamageAt = 0;
    this.nextBossTreeSpawnAt = this.time.now + TREE_BOSS_SPAWN_INITIAL_DELAY_MS;
    this.setHealthBarsVisible(true);
    this.refreshHealthBars();
    this.setArenaCamera();
    this.boss.play(this.getBossKey('move'), true);
  }

  handleBossRetryInput() {
    if (!this.gamepadInput?.connected) {
      this.updateBossRetrySelectionUi();
      return;
    }

    if (this.gamepadInput.menuUpJustPressed || this.gamepadInput.menuDownJustPressed) {
      this.retrySelectionIndex = this.retrySelectionIndex === RETRY_RESTART_OPTION
        ? RETRY_RETRY_OPTION
        : RETRY_RESTART_OPTION;
      this.updateBossRetrySelectionUi();
    }

    if (this.gamepadInput?.actionJustPressed) {
      this.confirmBossRetrySelection();
    }
  }

  updateBossRetrySelectionUi() {
    const showControllerSelection = Boolean(this.awaitingBossRetry && this.gamepadInput?.connected);
    const selectedButton = this.retrySelectionIndex === RETRY_RESTART_OPTION
      ? this.restartLevelButton
      : this.retryButton;

    this.retrySelectionMarker?.setVisible(showControllerSelection);
    this.retryControllerHelpText?.setVisible(showControllerSelection);

    if (!showControllerSelection) {
      this.restartLevelButton?.setScale(1);
      this.retryButton?.setScale(1);
      return;
    }

    this.restartLevelButton.setScale(this.retrySelectionIndex === RETRY_RESTART_OPTION ? 1.08 : 1);
    this.retryButton.setScale(this.retrySelectionIndex === RETRY_RETRY_OPTION ? 1.08 : 1);
    this.retrySelectionMarker.setPosition(selectedButton.x - selectedButton.width / 2 - 40, selectedButton.y - 6);
  }

  confirmBossRetrySelection() {
    if (this.retrySelectionIndex === RETRY_RESTART_OPTION) {
      this.restartCurrentLevel();
      return;
    }

    this.retryBossFight();
  }

  retryBossFight() {
    if (!this.awaitingBossRetry) {
      return;
    }

    this.awaitingBossRetry = false;
    this.bossIntroActive = true;
    this.bossState = 'intro';
    this.hideBossRetryUi();
    this.placeBossFightCharactersAtStart();
    this.activateBossCheckpoint();
    this.createArenaWall();
    this.setArenaCamera();
    this.showBossSplash();

    this.time.delayedCall(BOSS_INTRO_MS, () => {
      if (!this.bossIntroActive || this.bossDefeated) {
        return;
      }

      this.hideBossSplash();
      this.startBossCountdown();
    });
  }

  restartCurrentLevel() {
    if (!this.awaitingBossRetry) {
      return;
    }

    this.hideBossRetryUi();
    this.scene.start('LevelScene', {
      levelIndex: this.levelIndex,
      score: this.levelStartScore,
      levelStartScore: this.levelStartScore,
      highScore: this.highScore,
    });
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
    setSpriteTexture(this.player, 'char-stand');
    this.playerState = 'stand';
    this.configurePlayerBody();
  }

  placeBossFightCharactersAtStart() {
    this.placePlayerAtBossStart();
    this.placeBossAtStart();
  }

  placeBossAtStart() {
    const standKey = this.getBossKey('stand');
    this.bossScale = this.resolveBossScale(standKey);
    this.boss.body.enable = true;
    this.boss.body.setAllowGravity(false);
    this.boss.body.setImmovable(true);
    this.boss.setVelocity(0, 0);
    setSpriteTexture(this.boss, standKey);
    this.boss.setScale(this.bossScale);
    this.boss.setPosition(this.level.boss.spawn.x, this.getBossVisualY(standKey));
    this.boss.setFlipX(true);
    this.setBossAnimationTimeScale(1);
    this.bossDirection = -1;
    this.configureBossBody();
  }

  getBossVisualY(textureKey = this.boss.texture.key, visualScale = this.boss?.scaleY ?? this.bossScale) {
    const logicalTextureKey = typeof textureKey === 'string' &&
      textureKey.startsWith('runtime-sprite-atlas')
      ? getLogicalTextureKey(this.boss)
      : textureKey;

    return this.level.boss.floorY +
      this.getTextureBottomPadding(logicalTextureKey) * visualScale +
      BOSS_FOOT_SINK;
  }

  alignBossToFloor() {
    if (!this.boss || this.bossDefeated) {
      return;
    }

    this.boss.setY(this.getBossVisualY(this.boss.texture.key));
  }

  setBossAnimationTimeScale(timeScale) {
    if (this.boss?.anims) {
      this.boss.anims.timeScale = timeScale;
    }
  }

  setBossStateScale(scaleMultiplier = 1) {
    this.boss.setScale(this.bossScale * scaleMultiplier);
  }

  setBossScaleForAnimation(textureKey) {
    this.setBossStateScale(this.getBossAnimationScaleMultiplier(textureKey));
  }

  getBossAnimationScaleMultiplier(textureKey) {
    const bossConfig = this.getBossConfig();
    const kind = this.getBossTextureKind(textureKey);
    const shouldMatchMove = bossConfig.scaleAnimationsToMove?.includes(kind);

    if (!shouldMatchMove) {
      return 1;
    }

    const moveKey = this.getBossKey('move');

    if (!this.textures.exists(moveKey) || !this.textures.exists(textureKey)) {
      return 1;
    }

    const moveHeight = this.getTextureContentBounds(moveKey).height;
    const animationHeight = this.getTextureContentBounds(textureKey).height;

    if (!moveHeight || !animationHeight) {
      return 1;
    }

    return moveHeight / animationHeight;
  }

  getBossTextureKind(textureKey) {
    const phaseSuffix = this.bossPhase === 2 ? '-2' : '';
    const prefix = `boss-${this.level.id}${phaseSuffix}-`;

    return textureKey.startsWith(prefix)
      ? textureKey.slice(prefix.length)
      : textureKey;
  }

  getBossDefeatedScale(defeatedKey) {
    const bossConfig = this.getBossConfig();

    if (bossConfig.defeatedScaleMatchesStand) {
      const standKey = this.getBossKey('stand');
      const standVisibleHeight = this.getTextureContentBounds(standKey).height;
      const defeatedVisibleHeight = this.getTextureContentBounds(defeatedKey).height;
      const scaleMultiplier = bossConfig.defeatedStandScaleMultiplier ?? 1;

      return ((standVisibleHeight * this.bossScale) / defeatedVisibleHeight) *
        scaleMultiplier;
    }

    const playerVisibleHeight = this.getTextureContentBounds('char-stand').height * PLAYER_SCALE;
    const defeatedTexture = this.textures.get(defeatedKey).getSourceImage();
    const defeatedVisibleHeight = bossConfig.defeatedScaleUsesFullFrame
      ? defeatedTexture.height
      : this.getTextureContentBounds(defeatedKey).height;

    return (playerVisibleHeight / defeatedVisibleHeight) * bossConfig.defeatedScaleMultiplier;
  }

  getBossDefeatedY(defeatedKey, defeatedScale) {
    const bossConfig = this.getBossConfig();

    return this.level.boss.floorY +
      this.getTextureBottomPadding(defeatedKey) * defeatedScale +
      bossConfig.defeatedFootSink;
  }

  resolveBossScale(standKey) {
    const playerVisibleHeight = this.getTextureContentBounds('char-stand').height * PLAYER_SCALE;
    const bossVisibleHeight = this.getTextureContentBounds(standKey).height;

    return (playerVisibleHeight / bossVisibleHeight) *
      BOSS_SCALE_MULTIPLIER *
      this.getBossConfig().scaleMultiplier;
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

  getBossSplashAudioConfig() {
    const configs = BOSS_SPLASH_AUDIO[this.level.id]?.[this.bossPhase] ?? [];
    const playableConfigs = configs.filter((config) => this.cache.audio.exists(config.key));

    if (playableConfigs.length === 0) {
      return null;
    }

    const lastKey = this.lastBossSplashAudioKeyByPhase[this.bossPhase];
    const selectableConfigs = playableConfigs.length > 1
      ? playableConfigs.filter((config) => config.key !== lastKey)
      : playableConfigs;

    return Phaser.Utils.Array.GetRandom(selectableConfigs);
  }

  playBossSplashSound() {
    const config = this.getBossSplashAudioConfig();

    if (!config?.key || this.sound.locked) {
      return;
    }

    this.stopBossSplashSound();

    const configVolume = config.volume ?? 1;
    const pooledEntry = this.bossSplashSoundPool.get(config.key);
    const sound = pooledEntry?.sound ?? this.sound.add(config.key, {
      volume: configVolume * 0.5 * getAudioChannelVolume(AUDIO_CHANNELS.voice),
    });

    sound.setVolume(configVolume * 0.5 * getAudioChannelVolume(AUDIO_CHANNELS.voice));
    sound.off(Phaser.Sound.Events.COMPLETE);

    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      if (this.activeBossSplashSound?.sound === sound) {
        this.activeBossSplashSound = null;
      }

      if (!pooledEntry) {
        sound.destroy();
      }
    });

    sound.play();
    this.activeBossSplashSound = {
      key: config.key,
      sound,
      configVolume,
      pooled: Boolean(pooledEntry),
    };
    this.lastBossSplashAudioKeyByPhase[this.bossPhase] = config.key;
  }

  playRetrySound() {
    const config = getNextRetrySoundConfig();

    if (!config?.key || this.sound.locked || !this.cache.audio.exists(config.key)) {
      return;
    }

    this.stopRetrySound();

    const sound = this.sound.add(config.key, {
      volume: 0.5 * getAudioChannelVolume(AUDIO_CHANNELS.voice),
    });

    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      if (this.activeRetrySound === sound) {
        this.activeRetrySound = null;
      }

      sound.destroy();
    });

    const started = sound.play();

    if (!started) {
      sound.destroy();
      return;
    }

    this.activeRetrySound = sound;
    rememberRetrySoundPlayback(config.key);
  }

  playCoinSfx() {
    if (this.sound.locked || !this.cache.audio.exists(COIN_SFX_KEY)) {
      return;
    }

    this.sound.play(COIN_SFX_KEY, {
      volume: COIN_SFX_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.sfx),
    });
  }

  playJumpSfx() {
    if (this.sound.locked || !this.cache.audio.exists(JUMP_SFX_KEY)) {
      return;
    }

    this.sound.play(JUMP_SFX_KEY, {
      volume: JUMP_SFX_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.sfx),
    });
  }

  playBossShotSfx() {
    if (this.sound.locked || !this.cache.audio.exists(BOSS_SHOT_SFX_KEY)) {
      return;
    }

    this.sound.play(BOSS_SHOT_SFX_KEY, {
      volume: BOSS_SHOT_SFX_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.sfx),
    });
  }

  playPlayerHittedSfx() {
    if (this.sound.locked || !this.cache.audio.exists(PLAYER_HITTED_SFX_KEY)) {
      return;
    }

    this.sound.play(PLAYER_HITTED_SFX_KEY, {
      volume: PLAYER_HITTED_SFX_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.sfx),
    });
  }

  playBossHittedSfx() {
    if (this.sound.locked || !this.cache.audio.exists(BOSS_HITTED_SFX_KEY)) {
      return;
    }

    this.sound.play(BOSS_HITTED_SFX_KEY, {
      volume: BOSS_HITTED_SFX_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.sfx),
    });
  }

  stopRetrySound() {
    const activeSound = this.activeRetrySound;

    this.activeRetrySound = null;

    if (!activeSound) {
      return;
    }

    if (activeSound.isPlaying || activeSound.isPaused) {
      activeSound.stop();
    }

    activeSound.destroy();
  }

  stopBossSplashSound() {
    const activeEntry = this.activeBossSplashSound;
    const activeSound = activeEntry?.sound;

    this.activeBossSplashSound = null;

    if (!activeSound) {
      return;
    }

    if (activeSound.isPlaying || activeSound.isPaused) {
      activeSound.stop();
    }

    if (!activeEntry.pooled) {
      activeSound.destroy();
    }
  }

  showBossSplash() {
    this.hideBossSplash();
    this.bossSplash = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.getBossKey('splashscreen'))
      .setScrollFactor(0)
      .setDepth(140);

    this.fitImageToScreen(this.bossSplash);
    this.updateLevelMusicPause();
    this.playBossSplashSound();
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

    if (this.bossState === 'charge') {
      this.updateBossCharge();
      return;
    }

    if (this.bossState === 'dodge') {
      this.updateBossDodge();
      return;
    }

    if (this.bossState === 'attack') {
      this.boss.setVelocityX(0);
      return;
    }

    const bossConfig = this.getBossConfig();
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
    this.setBossStateScale();
    this.boss.play(this.getBossKey('move'), true);
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
    if (!this.bossFightActive || this.bossDefeated || this.bossIntroActive || this.bossIsHit || this.bossState === 'dodge') {
      return;
    }

    this.resolveBossStompAttempt();
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

  resolveBossStompAttempt() {
    if (!this.isPlayerInBossStompZone()) {
      return false;
    }

    if (this.tryBossDodge()) {
      return true;
    }

    this.damageBoss();
    return true;
  }

  tryBossDodge() {
    const bossConfig = this.getBossConfig();

    if (
      this.time.now < this.nextBossDodgeAt ||
      this.bossState === 'charge' ||
      Math.random() > (bossConfig.dodgeChance ?? 0)
    ) {
      return false;
    }

    const arenaLeft = bossConfig.arenaLeft + BOSS_DODGE_EDGE_MARGIN;
    const arenaRight = bossConfig.arenaRight - BOSS_DODGE_EDGE_MARGIN;
    const awayFromPlayer = this.player.x < this.boss.x ? 1 : -1;
    const targetAwayX = this.boss.x + awayFromPlayer * BOSS_DODGE_MIN_SPACE;
    const direction = targetAwayX >= arenaLeft && targetAwayX <= arenaRight
      ? awayFromPlayer
      : -awayFromPlayer;

    this.bossState = 'dodge';
    this.bossDodgeStartedAt = this.time.now;
    this.bossDodgeDirection = direction;
    this.nextBossDodgeAt = this.time.now + (bossConfig.dodgeCooldown ?? 1200);
    this.nextBossAttackAt = Math.max(
      this.nextBossAttackAt,
      this.time.now + (bossConfig.dodgeAttackCooldown ?? bossConfig.attackCooldown),
    );
    this.nextBossContactDamageAt = Math.max(
      this.nextBossContactDamageAt,
      this.time.now + (
        bossConfig.dodgeContactCooldown ??
        bossConfig.dodgeAttackCooldown ??
        bossConfig.attackCooldown
      ),
    );
    this.bossDirection = direction;
    this.boss.setFlipX(direction < 0);
    this.boss.setVelocityX(direction * (bossConfig.dodgeSpeed ?? 720));
    this.setBossAnimationTimeScale(BOSS_DODGE_ANIMATION_TIME_SCALE);
    this.boss.play(this.getBossKey('move'), true);
    this.alignBossToFloor();

    return true;
  }

  updateBossDodge() {
    const bossConfig = this.getBossConfig();
    const duration = bossConfig.dodgeDuration ?? 220;
    const hitLeftEdge = this.boss.x <= bossConfig.arenaLeft + BOSS_DODGE_EDGE_MARGIN;
    const hitRightEdge = this.boss.x >= bossConfig.arenaRight - BOSS_DODGE_EDGE_MARGIN;
    const timedOut = this.time.now - this.bossDodgeStartedAt >= duration;

    if (hitLeftEdge) {
      this.boss.setX(bossConfig.arenaLeft + BOSS_DODGE_EDGE_MARGIN);
    } else if (hitRightEdge) {
      this.boss.setX(bossConfig.arenaRight - BOSS_DODGE_EDGE_MARGIN);
    }

    this.boss.setVelocityX(this.bossDodgeDirection * (bossConfig.dodgeSpeed ?? 720));
    this.boss.setFlipX(this.bossDodgeDirection < 0);
    this.alignBossToFloor();

    if (hitLeftEdge || hitRightEdge || timedOut) {
      this.endBossDodge();
    }
  }

  endBossDodge() {
    if (this.bossState !== 'dodge') {
      return;
    }

    this.boss.setVelocityX(0);
    this.setBossAnimationTimeScale(1);

    if (!this.bossDefeated && this.bossFightActive && !this.bossIsHit) {
      this.bossState = 'patrol';
      this.boss.play(this.getBossKey('move'), true);
      this.alignBossToFloor();
    }
  }

  startBossAttack() {
    if (this.bossState === 'attack' || this.bossState === 'charge') {
      return;
    }

    if (this.shouldStartBossChargeAttack()) {
      this.startBossChargeAttack();
      return;
    }

    const bossConfig = this.getBossConfig();
    const attackConfig = this.resolveBossAttackConfig(bossConfig);

    this.bossState = 'attack';
    this.boss.setVelocityX(0);
    this.boss.setFlipX(this.player.x < this.boss.x);
    this.setBossScaleForAnimation(attackConfig.animationKey);
    this.setBossAnimationTimeScale(1);
    this.boss.play(attackConfig.animationKey, true);
    this.alignBossToFloor();
    this.nextBossAttackAt = this.time.now + bossConfig.attackCooldown;
    this.scheduleBossAttackProjectile(attackConfig);

    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.bossDefeated && this.bossFightActive) {
        this.bossState = 'patrol';
      }
    });
  }

  resolveBossAttackConfig(bossConfig) {
    const isSpecial = this.shouldUseBossSpecialAttack(bossConfig);

    return {
      ...bossConfig,
      animationKey: isSpecial ? this.getBossKey('attack-special') : this.getBossKey('attack'),
      projectileTextureKey: isSpecial ? this.getBossKey('shot-special') : this.getBossKey('shot'),
      shotOffsetX: isSpecial ? bossConfig.specialShotOffsetX ?? bossConfig.shotOffsetX : bossConfig.shotOffsetX,
      shotOffsetY: isSpecial ? bossConfig.specialShotOffsetY ?? bossConfig.shotOffsetY : bossConfig.shotOffsetY,
      shotScale: isSpecial ? bossConfig.specialShotScale ?? bossConfig.shotScale : bossConfig.shotScale,
      shotBodyWidth: isSpecial
        ? bossConfig.specialShotBodyWidth ?? bossConfig.shotBodyWidth
        : bossConfig.shotBodyWidth,
      shotBodyHeight: isSpecial
        ? bossConfig.specialShotBodyHeight ?? bossConfig.shotBodyHeight
        : bossConfig.shotBodyHeight,
      shotBodyOffsetY: isSpecial ? bossConfig.specialShotBodyOffsetY : undefined,
      shotBodyExtendsToFloor: isSpecial ? bossConfig.specialShotBodyExtendsToFloor : undefined,
      shotBodyLeadInset: isSpecial ? bossConfig.specialShotBodyLeadInset : undefined,
      shotBodyFullWidth: isSpecial ? bossConfig.specialShotBodyFullWidth : undefined,
      damage: isSpecial
        ? bossConfig.specialAttackDamage ?? PHASE_TWO_SPECIAL_ATTACK_DAMAGE
        : bossConfig.damage,
      projectileRange: isSpecial
        ? bossConfig.specialProjectileRange ?? bossConfig.projectileRange
        : bossConfig.projectileRange,
      projectileSpeed: isSpecial
        ? bossConfig.specialProjectileSpeed ?? bossConfig.projectileSpeed
        : bossConfig.projectileSpeed,
      projectileFrame: isSpecial
        ? bossConfig.specialProjectileFrame ?? bossConfig.projectileFrame
        : bossConfig.projectileFrame,
    };
  }

  shouldUseBossSpecialAttack(bossConfig) {
    return Boolean(bossConfig.specialAttackChance ?? CARD_SPREAD_ATTACK_CHANCE) &&
      this.anims.exists(this.getBossKey('attack-special')) &&
      this.textures.exists(this.getBossKey('shot-special')) &&
      Math.random() <= this.getBossSpecialAttackChance(
        bossConfig.specialAttackChance ?? CARD_SPREAD_ATTACK_CHANCE,
      );
  }

  scheduleBossAttackProjectile(attackConfig) {
    const projectileFrame = attackConfig.projectileFrame;
    const canFire = () => this.bossFightActive && !this.bossDefeated && this.bossState === 'attack';

    if (!projectileFrame) {
      this.time.delayedCall(320, () => {
        if (canFire()) {
          this.fireBossProjectile();
        }
      });
      return;
    }

    let fired = false;
    const stopListening = () => {
      this.boss.off(Phaser.Animations.Events.ANIMATION_UPDATE, handleUpdate);
    };
    const fire = () => {
      if (!fired && canFire()) {
        fired = true;
        this.fireBossProjectile(attackConfig);
      }
    };
    const handleUpdate = (_animation, frame) => {
      if (!canFire()) {
        stopListening();
        return;
      }

      if (this.getAnimationFrameNumber(frame) >= projectileFrame) {
        stopListening();
        fire();
      }
    };

    this.boss.on(Phaser.Animations.Events.ANIMATION_UPDATE, handleUpdate);
    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      stopListening();
      fire();
    });
  }

  getAnimationFrameNumber(frame) {
    const frameName = String(frame?.textureFrame ?? frame?.frame?.name ?? frame?.key ?? '');
    const frameNumberMatch = frameName.match(/-(\d+)$/);

    if (frameNumberMatch) {
      return Number(frameNumberMatch[1]);
    }

    return (frame?.index ?? 0) + 1;
  }

  shouldStartBossChargeAttack() {
    return this.level.id === CHARGE_ATTACK_BOSS_ID &&
      this.anims.exists(this.getBossKey('charge')) &&
      Math.random() <= this.getBossSpecialAttackChance(CHARGE_ATTACK_CHANCE);
  }

  startBossChargeAttack() {
    const direction = this.player.x < this.boss.x ? -1 : 1;

    this.bossState = 'charge';
    this.bossChargeStartedAt = this.time.now;
    this.bossChargeStartX = this.boss.x;
    this.bossChargeDirection = direction;
    this.bossDirection = direction;
    this.boss.setVelocityX(0);
    this.boss.setFlipX(direction < 0);
    this.setBossAnimationTimeScale(1);
    this.boss.play(this.getBossKey('charge'), true);
    this.alignBossToFloor();
    this.nextBossAttackAt = this.time.now + this.getBossConfig().attackCooldown;

    this.time.delayedCall(CHARGE_ATTACK_WINDUP_MS, () => {
      if (
        this.bossFightActive &&
        !this.bossDefeated &&
        !this.bossIsHit &&
        this.bossState === 'charge'
      ) {
        this.boss.setVelocityX(this.bossChargeDirection * CHARGE_ATTACK_SPEED);
      }
    });
  }

  updateBossCharge() {
    const bossConfig = this.getBossConfig();
    const distanceCharged = Math.abs(this.boss.x - this.bossChargeStartX);
    const hitLeftEdge = this.boss.x <= bossConfig.arenaLeft + 80;
    const hitRightEdge = this.boss.x >= bossConfig.arenaRight - 80;
    const timedOut = this.time.now - this.bossChargeStartedAt >= CHARGE_ATTACK_MAX_MS;
    const reachedMaxDistance = distanceCharged >= CHARGE_ATTACK_MAX_DISTANCE;

    this.boss.setFlipX(this.bossChargeDirection < 0);
    this.alignBossToFloor();

    if (hitLeftEdge) {
      this.boss.setX(bossConfig.arenaLeft + 80);
    } else if (hitRightEdge) {
      this.boss.setX(bossConfig.arenaRight - 80);
    }

    if (hitLeftEdge || hitRightEdge || timedOut || reachedMaxDistance) {
      this.endBossChargeAttack();
    }
  }

  endBossChargeAttack() {
    if (this.bossState !== 'charge') {
      return;
    }

    this.boss.setVelocityX(0);

    if (!this.bossDefeated && this.bossFightActive && !this.bossIsHit) {
      this.bossState = 'patrol';
      this.boss.play(this.getBossKey('move'), true);
      this.alignBossToFloor();
    }
  }

  fireBossProjectile(attackConfig = this.getBossConfig()) {
    const direction = this.player.x < this.boss.x ? -1 : 1;
    const bossConfig = attackConfig;
    const textureKey = attackConfig.projectileTextureKey ?? this.getBossKey('shot');
    const useCardSpread = this.shouldUseBossCardSpread() &&
      Math.random() <= this.getBossSpecialAttackChance(CARD_SPREAD_ATTACK_CHANCE);

    this.playBossShotSfx();

    if (useCardSpread) {
      this.fireBossCardSpread(direction, bossConfig, textureKey);
      return;
    }

    this.createBossProjectile({
      direction,
      bossConfig,
      textureKey,
      velocityY: 0,
    });

    this.scheduleBossPaintPuddle();
  }

  createBossProjectile({ direction, bossConfig, textureKey, velocityY }) {
    const projectile = this.projectiles
      .create(
        this.boss.x + direction * bossConfig.shotOffsetX,
        this.boss.y + bossConfig.shotOffsetY,
        ...getTextureArgs(textureKey),
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
    this.centerProjectileBody(projectile, textureKey, bossConfig, direction);
    projectile.setVelocity(direction * bossConfig.projectileSpeed, velocityY);
    projectile.setData('spawnX', projectile.x);
    projectile.setData('range', bossConfig.projectileRange);
    projectile.setData('damage', bossConfig.damage);
    projectile.setData('logicalTextureKey', textureKey);

    return projectile;
  }

  shouldUseBossCardSpread() {
    return this.level.id === CARD_SPREAD_BOSS_ID;
  }

  fireBossCardSpread(direction, bossConfig, textureKey) {
    const cardCount = Phaser.Math.Between(
      CARD_SPREAD_MIN_PROJECTILES,
      CARD_SPREAD_MAX_PROJECTILES,
    );
    const centerIndex = (cardCount - 1) / 2;

    for (let index = 0; index < cardCount; index += 1) {
      const velocityY = (index - centerIndex) * CARD_SPREAD_VERTICAL_SPEED_STEP;
      const projectile = this.createBossProjectile({
        direction,
        bossConfig,
        textureKey,
        velocityY,
      });

      projectile.setAngle(direction < 0 ? -velocityY * 0.12 : velocityY * 0.12);
    }
  }

  centerProjectileBody(projectile, textureKey, bossConfig, direction = 1) {
    const bounds = this.getTextureContentBounds(textureKey);
    const source = this.textures.get(textureKey).getSourceImage();
    const bodyWidth = bossConfig.shotBodyFullWidth
      ? source.width
      : bossConfig.shotBodyWidth / projectile.scaleX;
    const configuredBodyHeight = bossConfig.shotBodyHeight / projectile.scaleY;
    const bodyX = Number.isFinite(bossConfig.shotBodyLeadInset)
      ? direction > 0
        ? bounds.x + bounds.width - bodyWidth - bossConfig.shotBodyLeadInset
        : bounds.x + bossConfig.shotBodyLeadInset
      : bossConfig.shotBodyFullWidth
        ? 0
        : bounds.x + (bounds.width - bodyWidth) / 2;
    const bodyY = bounds.y + (bounds.height - configuredBodyHeight) / 2 +
      (bossConfig.shotBodyOffsetY ?? 0) / projectile.scaleY;
    const floorBodyBottom = (this.level.boss.floorY - projectile.y) / projectile.scaleY +
      projectile.height * projectile.originY;
    const bodyHeight = bossConfig.shotBodyExtendsToFloor
      ? Math.max(configuredBodyHeight, floorBodyBottom - bodyY)
      : configuredBodyHeight;

    projectile.body.setSize(bodyWidth, bodyHeight);
    projectile.body.setOffset(
      bodyX,
      bodyY,
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

  updateTrees() {
    if (!this.trees || !this.player?.body) {
      return;
    }

    this.trees.children.each((tree) => {
      if (
        !tree.active ||
        tree.getData('attacking') ||
        !tree.getData('checked') ||
        this.isPlayerOverlappingTree(tree)
      ) {
        return;
      }

      tree.setData('checked', false);
    });
  }

  isPlayerOverlappingTree(tree) {
    if (!tree?.body?.enable || !this.player?.body) {
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
        tree.body.x,
        tree.body.y,
        tree.body.width,
        tree.body.height,
      ),
    );
  }

  updateBossTrees() {
    if (
      !this.bossFightActive ||
      this.bossDefeated ||
      this.bossIntroActive ||
      this.bossCountdownActive ||
      this.awaitingBossRetry ||
      this.time.now < this.nextBossTreeSpawnAt
    ) {
      return;
    }

    if (this.getActiveBossTreeCount() < TREE_BOSS_MAX_ACTIVE) {
      this.spawnBossTree();
    }

    this.scheduleNextBossTreeSpawn();
  }

  getActiveBossTreeCount() {
    if (!this.trees) {
      return 0;
    }

    return this.trees.children.entries.filter((tree) => (
      tree.active && tree.getData('bossTree')
    )).length;
  }

  scheduleNextBossTreeSpawn() {
    this.nextBossTreeSpawnAt = this.time.now + Phaser.Math.Between(
      TREE_BOSS_SPAWN_MIN_DELAY_MS,
      TREE_BOSS_SPAWN_MAX_DELAY_MS,
    );
  }

  spawnBossTree() {
    const bossConfig = this.getBossConfig();
    const x = this.getBossTreeSpawnX(bossConfig);

    if (x === null) {
      return;
    }

    const tree = this.createTree(x, bossConfig.floorY, {
      attackChance: TREE_BOSS_ATTACK_CHANCE,
      bossTree: true,
    });
    tree.setAlpha(0);

    this.tweens.add({
      targets: tree,
      alpha: 1,
      duration: TREE_BOSS_FADE_MS,
      ease: 'Quad.out',
    });

    this.time.delayedCall(TREE_BOSS_LIFETIME_MS, () => {
      if (!tree.active || tree.getData('attacking')) {
        return;
      }

      this.tweens.add({
        targets: tree,
        alpha: 0,
        duration: TREE_BOSS_FADE_MS,
        onComplete: () => tree.destroy(),
      });
    });
  }

  getBossTreeSpawnX(bossConfig) {
    const minX = bossConfig.arenaLeft + TREE_BOSS_ARENA_MARGIN;
    const maxX = bossConfig.arenaRight - TREE_BOSS_ARENA_MARGIN;
    const preferredDirection = this.player.body.velocity.x < -10 || this.player.flipX ? -1 : 1;
    const directions = [preferredDirection, -preferredDirection];

    for (const direction of directions) {
      const distance = Phaser.Math.Between(
        TREE_BOSS_PLAYER_MIN_OFFSET,
        TREE_BOSS_PLAYER_MAX_OFFSET,
      );
      const x = Phaser.Math.Clamp(this.player.x + direction * distance, minX, maxX);

      if (this.isBossTreeSpawnSafe(x)) {
        return x;
      }
    }

    for (const direction of directions) {
      const x = Phaser.Math.Clamp(
        this.player.x + direction * TREE_BOSS_PLAYER_MAX_OFFSET,
        minX,
        maxX,
      );

      if (this.isBossTreeSpawnSafe(x)) {
        return x;
      }
    }

    return null;
  }

  isBossTreeSpawnSafe(x) {
    return Math.abs(x - this.player.x) >= TREE_BOSS_PLAYER_SAFE_DISTANCE &&
      Math.abs(x - this.boss.x) >= TREE_BOSS_PLAYER_MIN_OFFSET;
  }

  handleTreeOverlap(player, tree) {
    if (
      !tree.active ||
      tree.getData('attacking') ||
      this.playerIsHit ||
      this.isRespawning ||
      this.levelComplete ||
      this.awaitingBossRetry
    ) {
      return;
    }

    if (tree.getData('bossTree')) {
      if (!this.bossFightActive || this.bossIntroActive || this.bossCountdownActive || this.bossDefeated) {
        return;
      }

      if (tree.getData('checked')) {
        return;
      }

      tree.setData('checked', true);

      if (Math.random() > (tree.getData('attackChance') ?? TREE_BOSS_ATTACK_CHANCE)) {
        return;
      }

      this.startTreeAttack(tree, true);
      return;
    }

    if (this.bossFightActive || this.bossIntroActive || this.bossCountdownActive || tree.getData('checked')) {
      return;
    }

    tree.setData('checked', true);

    if (Math.random() > (tree.getData('attackChance') ?? TREE_NORMAL_ATTACK_CHANCE)) {
      return;
    }

    this.startTreeAttack(tree, false);
  }

  startTreeAttack(tree, isBossTree) {
    tree.setData('attacking', true);
    tree.setFlipX(this.player.x < tree.x);
    tree.body.enable = false;
    tree.play(TREE_ATTACK_ANIMATION_KEY, true);

    if (isBossTree) {
      this.damagePlayer(TREE_BOSS_DAMAGE, { critChance: 0 });
      tree.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        tree.destroy();
      });
      return;
    }

    this.playPlayerHittedSfx();
    this.cameras.main.shake(130, 0.003);
    this.playerIsHit = true;
    this.player.setVelocityX(0);
    this.player.setTint(0xff7777);

    tree.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.player?.active) {
        return;
      }

      this.playerIsHit = false;
      setSpriteTexture(tree, 'tree');
      tree.setFlipX(false);
      const lostCoins = this.loseCoins(TREE_NORMAL_COIN_PENALTY);
      this.refreshHud();
      this.respawnPlayer(
        true,
        lostCoins > 0
          ? `Baum-Angriff! -${lostCoins} Coin`
          : 'Baum-Angriff! Zurueck zum Checkpoint',
      );
      tree.setData('attacking', false);
      tree.setData('checked', false);
      tree.body.enable = true;
    });
  }

  clearBossTrees() {
    this.nextBossTreeSpawnAt = 0;
    this.trees?.children.each((tree) => {
      if (!tree.getData('bossTree')) {
        return;
      }

      this.tweens.killTweensOf(tree);
      tree.destroy();
    });
  }

  shouldUseBossPaintPuddles() {
    return PAINT_PUDDLE_LEVEL_IDS.has(this.level.id) &&
      this.textures.exists(this.getPaintPuddleTextureKey());
  }

  getPaintPuddleTextureKey() {
    const phaseKey = this.getBossKey('puddle');

    return this.textures.exists(phaseKey) ? phaseKey : `boss-${this.level.id}-puddle`;
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
      Math.random() > this.getBossSpecialAttackChance(PAINT_PUDDLE_SPAWN_CHANCE)
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
      Math.random() > this.getBossSpecialAttackChance(PAINT_PUDDLE_SPAWN_CHANCE)
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
      .create(imageX, imageY, ...getTextureArgs(textureKey))
      .setOrigin(0.5)
      .setDisplaySize(tuning.displayWidth, displayHeight)
      .setDepth(6);
    puddle.setData('logicalTextureKey', textureKey);

    puddle.refreshBody();

    const contentDisplayWidth = bounds.width * scale;
    const bodyWidth = Math.min(PAINT_PUDDLE_BODY_WIDTH, contentDisplayWidth);
    const bodyHeight = PAINT_PUDDLE_BODY_HEIGHT;
    puddle.body.setSize(bodyWidth, bodyHeight);
    puddle.body.setOffset(
      bounds.x * scale + (contentDisplayWidth - bodyWidth) / 2,
      bounds.y * scale,
    );

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

  getBossSpecialAttackChance(baseChance) {
    return Phaser.Math.Clamp(
      baseChance - this.levelBallsCollected * BOSS_SPECIAL_ATTACK_REDUCTION_PER_BALL,
      0,
      baseChance,
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

    if (this.bossState === 'dodge') {
      return;
    }

    const playerCanHit =
      !this.bossIsHit &&
      player.body.velocity.y > 80 &&
      this.isPlayerInBossStompZone();

    if (playerCanHit) {
      this.resolveBossStompAttempt();
      return;
    }

    if (player.y < boss.y - BOSS_CONTACT_DAMAGE_HEIGHT) {
      return;
    }

    if (!this.playerBossContactDamageArmed) {
      return;
    }

    if (this.time.now < this.nextBossContactDamageAt) {
      return;
    }

    this.playerBossContactDamageArmed = false;
    this.damagePlayer(this.getBossConfig().damage);

    if (this.bossState === 'charge') {
      this.endBossChargeAttack();
    }
  }

  handleProjectileHit(player, projectile) {
    if (!this.bossFightActive || this.bossIntroActive || this.bossDefeated) {
      return;
    }

    const damage = projectile.getData('damage') ?? this.getBossConfig().damage;
    projectile.destroy();
    this.damagePlayer(damage);
  }

  damageBoss() {
    if (this.bossIsHit || this.bossDefeated) {
      return;
    }

    const hit = this.resolveHitDamage(1, PLAYER_CRIT_CHANCE);
    let remainingDamage = hit.damage;

    if (this.bossPhase === 2 && this.bossShieldHp > 0) {
      const shieldDamage = Math.min(this.bossShieldHp, remainingDamage);
      this.bossShieldHp -= shieldDamage;
      remainingDamage -= shieldDamage;
    }

    if (remainingDamage > 0) {
      this.bossHp = Math.max(0, this.bossHp - remainingDamage);
    }

    this.bossIsHit = true;
    this.playBossHittedSfx();
    this.bossState = 'hit';
    this.boss.setVelocityX(0);
    this.player.setVelocityY(BOSS_HIT_BOUNCE);
    this.setBossScaleForAnimation(this.getBossKey('hit'));
    this.setBossAnimationTimeScale(1);
    this.boss.play(this.getBossKey('hit'), true);
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
        this.setBossStateScale();
        this.alignBossToFloor();
        this.bossState = 'patrol';
      }
    });
  }

  damagePlayer(damage, { critChance = this.getBossCritChance() } = {}) {
    if (this.playerIsHit || this.isRespawning || this.bossDefeated || !this.bossFightActive) {
      return;
    }

    const hit = this.resolveHitDamage(damage, critChance);
    this.playerHp = Math.max(0, this.playerHp - hit.damage);
    this.playerIsHit = true;
    this.playPlayerHittedSfx();
    this.player.setVelocityX(0);
    this.player.stop();
    this.player.play(this.getPlayerHitBossKey(), true);
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
      .image(GAME_WIDTH / 2, CRIT_HIT_Y, ...getTextureArgs('crit-hit'))
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

    if (this.hasBossPhaseTwo() && this.bossPhase === 1) {
      this.startBossPhaseTwo();
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
    const defeatedKey = this.getBossKey('defeated');
    const defeatedScale = this.getBossDefeatedScale(defeatedKey);
    setSpriteTexture(this.boss, defeatedKey);
    this.boss.setScale(
      defeatedScale * (this.getBossConfig().defeatedScaleXMultiplier ?? 1),
      defeatedScale,
    );
    this.boss.setY(this.getBossDefeatedY(defeatedKey, defeatedScale));
    this.setHealthBarsVisible(false);
    this.hideBossSplash();
    this.removeArenaWall();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.clearBossTrees();
    this.goal.enableBody(false, this.goal.x, this.goal.y, true, true);
    this.goal.refreshBody();
    this.setArenaCamera();
    this.showToast('Boss besiegt!');
  }

  startBossPhaseTwo() {
    this.bossPhase = 2;
    this.bossFightActive = false;
    this.bossIntroActive = true;
    this.bossCountdownActive = false;
    this.bossIsHit = false;
    this.bossState = 'intro';
    this.nextBossAttackAt = 0;
    this.nextBossContactDamageAt = 0;
    this.bossBodyBounds = null;
    this.bossBodyTextureKey = null;
    this.boss.setVelocity(0, 0);
    this.boss.stop();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.clearBossTrees();
    this.setHealthBarsVisible(false);
    this.ensureBossAnimations();
    this.placeBossFightCharactersAtStart();
    this.createArenaWall();
    this.setArenaCamera();
    this.showBossSplash();
    this.showToast('Phase 2!');

    this.time.delayedCall(BOSS_INTRO_MS, () => {
      if (!this.bossIntroActive || this.bossDefeated || this.bossPhase !== 2) {
        return;
      }

      this.hideBossSplash();
      this.startBossCountdown();
    });
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
    this.nextBossContactDamageAt = 0;
    this.boss.setVelocity(0, 0);
    this.boss.body.enable = true;
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    if (this.bossPhase === 2) {
      this.bossShieldMax = Math.ceil(this.bossMaxHp * BOSS_SHIELD_MAX_RATIO);
      this.bossShieldHp = this.bossShieldMax;
    } else {
      this.bossShieldMax = 0;
      this.bossShieldHp = 0;
    }
    const standKey = this.getBossKey('stand');
    this.bossScale = this.resolveBossScale(standKey);
    setSpriteTexture(this.boss, standKey);
    this.boss.setScale(this.bossScale);
    this.boss.setPosition(this.level.boss.spawn.x, this.getBossVisualY(standKey));
    this.configureBossBody();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.clearBossTrees();
    this.hideBossSplash();
    this.setHealthBarsVisible(false);
    this.placePlayerAtBossStart();
    this.setArenaCamera();
    this.showBossRetryUi();
  }

  configureBossBody() {
    const standKey = this.getBossKey('stand');

    if (!this.bossBodyBounds || this.bossBodyTextureKey !== standKey) {
      const bounds = this.getTextureContentBounds(standKey);
      const width = bounds.width * BOSS_BODY_WIDTH_RATIO;
      const height = bounds.height * BOSS_BODY_HEIGHT_RATIO;
      this.bossBodyTextureKey = standKey;
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
    this.renderBossShieldBar();
  }

  refreshHealthBars() {
    this.bossHealthBar.labelText.setText(this.getBossConfig().name ?? `Boss ${this.level.id}`);
    this.renderSegmentedHealthBar(this.playerHealthBar, this.playerHp, this.playerMaxHp);
    this.renderSegmentedHealthBar(this.bossHealthBar, this.bossHp, this.bossMaxHp);
    this.renderBossShieldBar();
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

    if (pickupType === 'coin' || pickupType === 'ball') {
      this.playCoinSfx();
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

      if (nextIndex < getLevelCount()) {
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

  respawnPlayer(isManual, message = null) {
    if (this.isRespawning || this.levelComplete) {
      return;
    }

    this.isRespawning = true;
    this.playerIsHit = false;
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
    setSpriteTexture(this.player, 'char-stand');
    this.configurePlayerBody();
    this.cameras.main.shake(150, 0.004);
    this.showToast(message ?? (isManual ? 'Respawn' : `Fallstrafe -${lostCoins} Coins`));

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

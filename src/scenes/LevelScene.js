import Phaser from 'phaser';
import introMusicMp3Url from '../../assets/shared/KamisWorldIntro.mp3';
import introMusicOggUrl from '../../assets/shared/KamisWorldIntro.ogg';
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
import { RETRY_SOUNDS, getNextRetrySoundConfig, rememberRetrySoundPlayback } from '../data/retrySounds.js';
import { shouldShowPlatformNumbers, shouldStartAtBoss, shouldStartBossDefeated } from '../game/devConfig.js';
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
import { isAppleTouchDevice } from '../utils/device.js';
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
const PLATFORM_NUMBER_LABEL_OFFSET = 18;
const MOVING_PLATFORM_DEFAULT_SPEED = 90;
const FALLING_PLATFORM_STAND_DELAY_MS = 240;
const FALLING_PLATFORM_WOBBLE_MS = 320;
const FALLING_PLATFORM_DROP_SPEED = 640;
const FALLING_PLATFORM_WOBBLE_OFFSET = 6;
const FALLING_PLATFORM_WOBBLE_STEP_MS = 36;
const HUD_PANEL_WIDTH = 370;
const HUD_PANEL_HEIGHT = 146;
const HUD_TEXT_X = 34;
const HUD_HELP_WRAP_WIDTH = HUD_PANEL_WIDTH - 32;
const HUD_HELP_TEXT_KEYBOARD = 'A/D oder Pfeile bewegen  Space springt  R respawn';
const HUD_HELP_TEXT_GAMEPAD = 'Stick oder D-Pad bewegen  A springt  Start respawn';
const HUD_HELP_TEXT_TOUCH = 'Touch bewegen  Touch springt';
const CHECKPOINT_TEXTURE_WIDTH = 52;
const CHECKPOINT_TEXTURE_HEIGHT = 56;
const CHECKPOINT_PLATFORM_EDGE_PADDING = Math.ceil(CHECKPOINT_TEXTURE_WIDTH / 2) + 10;
const CHECKPOINT_PLATFORM_SNAP_DISTANCE = 96;
const FINAL_TREASURE_LEVEL_ID = 6;
const TREASURE_BOX_ANIMATION_KEY = 'treasure-box-open-animation';
const TREASURE_BOX_DISPLAY_WIDTH = 128;
const TREASURE_BOX_FOOT_SINK = 18;
const TREASURE_REVEAL_MAX_WIDTH = 1085;
const TREASURE_REVEAL_MAX_HEIGHT = 525;
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
const BOSS_POST_HIT_SHIFT_MIN = 70;
const BOSS_POST_HIT_SHIFT_MAX = 120;
const BOSS_POST_HIT_SHIFT_DURATION_MS = 180;
const BOSS_STOMP_MIN_HEIGHT = 20;
const BOSS_STOMP_MAX_HEIGHT = 112;
const BOSS_STOMP_EXTRA_WIDTH = 24;
const BOSS_DIRECTION_DEADZONE = 36;
const BOSS_CONTACT_DAMAGE_HEIGHT = 46;
const BOSS_CONTACT_SAFE_TOP_MARGIN = 14;
const BOSS_CONTACT_DAMAGE_REARM_MS = 1700;
const BOSS_CONTACT_KNOCKBACK_X = 360;
const BOSS_CONTACT_KNOCKBACK_Y = -180;
const BOSS_DODGE_EDGE_MARGIN = 90;
const BOSS_ARENA_BOUNDARY_WIDTH = 48;
const BOSS_DODGE_MIN_SPACE = 150;
const BOSS_UNSTICK_OVERLAP_GRACE_MS = 2000;
const BOSS_UNSTICK_SLIDE_COOLDOWN_MS = 1400;
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
const PLAYER_CRIT_CHANCE = 0.15;
const BOSS_CRIT_BASE_CHANCE = 0.16;
const BOSS_CRIT_CHANCE_PER_LEVEL = 0.015;
const BOSS_CRIT_MAX_CHANCE = 0.28;
const BOSS_CRIT_REDUCTION_PER_BALL = 0.02;
const CRIT_DAMAGE_MIN = 3;
const CRIT_DAMAGE_MAX = 8;
const CRIT_HIT_DISPLAY_WIDTH = 320;
const CRIT_HIT_Y = 112;
const LEVEL_MUSIC_KEY = 'kamis-world-level';
const LEVEL_MUSIC_VOLUME = 0.05;
const INTRO_MUSIC_KEY = 'kamis-world-intro';
const INTRO_MUSIC_VOLUME = 0.15;
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
const CAKE_RAIN_PROJECTILE_COUNT = 8;
const CAKE_RAIN_PROJECTILE_DELAY_MS = 115;
const CAKE_RAIN_FALL_SPEED = 420;
const CAKE_RAIN_SPAWN_TOP_PADDING = 34;
const CAKE_RAIN_ARENA_MARGIN = 45;
const CAKE_RAIN_LANE_JITTER_MULTIPLIER = 0.22;
const CAKE_RAIN_BOSS_CLEAR_RADIUS = 170;
const CAKE_RAIN_ROTATION_DEGREES = 90;
const TREE_ATTACK_ANIMATION_KEY = 'tree-hit';
const TREE_DISPLAY_HEIGHT = 175;
const TREE_FOOT_SINK = 18;
const TREE_ATTACK_BOX_WIDTH_MULTIPLIER = 0.78;
const TREE_ATTACK_BOX_HEIGHT = 78;
const TREE_NORMAL_ATTACK_CHANCE = 0.45;
const TREE_NORMAL_COIN_PENALTY = 1;
const TREE_BOSS_ATTACK_CHANCE = 0.65;
const TREE_NORMAL_COUNT = 3;
const TREE_NORMAL_MIN_PLATFORM_WIDTH = 220;
const TREE_NORMAL_START_PADDING = 220;
const TREE_NORMAL_RESPAWN_PADDING = 180;
const TREE_NORMAL_BOSS_PADDING = 220;
const TREE_BOSS_DAMAGE = 1;
const TREE_BOSS_MAX_ACTIVE = 2;
const TREE_BOSS_SPAWN_INITIAL_DELAY_MS = 1500;
const TREE_BOSS_SPAWN_MIN_DELAY_MS = 4250;
const TREE_BOSS_SPAWN_MAX_DELAY_MS = 7000;
const TREE_BOSS_LIFETIME_MS = 8000;
const TREE_BOSS_FADE_MS = 280;
const TREE_BOSS_ARENA_MARGIN = 170;
const TREE_BOSS_PLAYER_MIN_OFFSET = 190;
const TREE_BOSS_PLAYER_MAX_OFFSET = 360;
const TREE_BOSS_PLAYER_SAFE_DISTANCE = 240;
const FIRST_AID_KIT_DISPLAY_HEIGHT = 32;
const FIRST_AID_KIT_HEAL_AMOUNT = 3;
const FIRST_AID_KIT_HEALTH_THRESHOLD = 4;
const FIRST_AID_KIT_BOSS_MIN_HEALTH_RATIO = 0.25;
const FIRST_AID_KIT_SPAWN_CHANCE = 0.8;
const FIRST_AID_KIT_MAX_SPAWNS_PER_FIGHT = 3;
const FIRST_AID_KIT_SPAWN_INITIAL_DELAY_MS = 2200;
const FIRST_AID_KIT_SPAWN_COOLDOWN_MS = 9000;
const FIRST_AID_KIT_ARENA_MARGIN = 190;
const FIRST_AID_KIT_PLAYER_SAFE_DISTANCE = 300;
const FIRST_AID_KIT_BOSS_SAFE_DISTANCE = 130;
const FIRST_AID_KIT_FOOT_OFFSET = 12;
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
const BOSS_RETRY_EASE_FIRST_STEP = 0.05;
const BOSS_RETRY_EASE_STEP = 0.1;
const BOSS_RETRY_EASE_MAX = 0.6;

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
    this.finalTreasureSequenceActive = false;
    this.finalTreasureReady = false;
    this.finalTreasureContinueHandler = null;
    this.finalTreasureMusic = null;
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
    this.playerBossStompConsumed = false;
    this.bossIsHit = false;
    this.levelCoinHpBonus = 0;
    this.levelBallsCollected = 0;
    this.bossPhase = 1;
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.bossMaxHp = this.getBossMaxHp();
    this.playerHp = this.playerMaxHp;
    this.bossHp = this.bossMaxHp;
    this.bossShieldMax = 0;
    this.bossShieldHp = 0;
    this.bossRetryCount = 0;
    this.bossEnrageActive = false;
    this.bossEnrageAnnounced = false;
    this.bossRainAttackActive = false;
    this.nextBossAttackAt = 0;
    this.nextBossContactDamageAt = 0;
    this.bossDirection = -1;
    this.bossScale = 1;
    this.bossBottomPaddingByTexture = new Map();
    this.bossBodyBounds = null;
    this.playerSlowUntil = 0;
    this.playerJumpBlockedUntil = 0;
    this.nextBossTreeSpawnAt = 0;
    this.nextFirstAidKitSpawnAt = 0;
    this.firstAidKitSpawnsThisFight = 0;
    this.nextPaintPuddleSpawnAt = 0;
    this.bossChargeStartedAt = 0;
    this.bossChargeStartX = 0;
    this.bossChargeDirection = -1;
    this.bossDodgeStartedAt = 0;
    this.bossDodgeDirection = -1;
    this.nextBossDodgeAt = 0;
    this.bossUnstickOverlapStartedAt = 0;
    this.nextBossUnstickSlideAt = 0;
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
      this.stopFinalTreasureMusic();
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
    this.createMovingPlatforms();
    this.createFallingPlatforms();
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
    const devBossStarted = this.applyDevBossStart();
    refreshGamepads(this);
    if (!devBossStarted) {
      this.showToast(`Level ${this.level.id}: ${this.level.name}`);
    }
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
    return isAppleTouchDevice();
  }

  getHudHelpText() {
    if (this.gamepadInput?.connected) {
      return HUD_HELP_TEXT_GAMEPAD;
    }

    if (this.supportsTouchControls() && !this.touchControlsSuppressedByHardwareInput) {
      return HUD_HELP_TEXT_TOUCH;
    }

    return HUD_HELP_TEXT_KEYBOARD;
  }

  updateHudHelpText() {
    const helpText = this.getHudHelpText();

    if (this.currentHudHelpText === helpText) {
      return;
    }

    this.currentHudHelpText = helpText;
    this.helpText?.setText(helpText);
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
    if (!this.cache.audio.exists(INTRO_MUSIC_KEY)) {
      this.load.audio(INTRO_MUSIC_KEY, [introMusicOggUrl, introMusicMp3Url]);
    }

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
      this.applyFinalTreasureMusicVolume();
    });
  }

  applyDevBossDefeatedStart() {
    if (!shouldStartBossDefeated()) {
      return false;
    }

    if (this.hasBossPhaseTwo()) {
      this.bossPhase = 2;
      this.ensureBossAnimations();
    }

    this.bossHp = 0;
    this.bossShieldHp = 0;
    this.defeatBoss();
    this.placePlayerAtDefeatedBossStart();
    this.respawnPoint = {
      x: this.player.x,
      y: this.player.y,
    };
    this.showToast('Debug: Boss bereits besiegt');
    return true;
  }

  applyDevBossStart() {
    if (this.applyDevBossDefeatedStart()) {
      return true;
    }

    if (!shouldStartAtBoss()) {
      return false;
    }

    this.startBossFight();
    this.showToast('Debug: Bosskampf gestartet');
    return true;
  }

  placePlayerAtDefeatedBossStart() {
    const x = Math.max(
      this.level.boss.arenaLeft + 140,
      this.level.goal.x - 180,
    );
    const y = this.level.boss.floorY + PLAYER_ARENA_FOOT_SINK;

    this.player.setPosition(x, y);
    this.player.body.reset(x, y);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.player.stop();
    setSpriteTexture(this.player, 'char-stand');
    this.playerState = 'stand';
    this.configurePlayerBody();
    this.cameras.main.centerOn(x, y - GAME_HEIGHT * 0.15);
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

    const config = {
      ...this.level.boss,
      ...phaseOverrides,
    };

    return this.applyBossEnrageConfig(config);
  }

  applyBossEnrageConfig(config) {
    if (!this.isBossEnraged(config)) {
      return config;
    }

    return {
      ...config,
      speed: config.speed * (config.enrageSpeedMultiplier ?? 1),
      attackCooldown: Math.round(config.attackCooldown * (config.enrageCooldownMultiplier ?? 1)),
      projectileSpeed: config.projectileSpeed * (config.enrageProjectileSpeedMultiplier ?? 1),
      dodgeChance: Phaser.Math.Clamp(
        (config.dodgeChance ?? 0) + (config.enrageDodgeChanceBonus ?? 0),
        0,
        0.9,
      ),
      specialAttackChance: this.getEnragedChance(
        config.specialAttackChance,
        config.enrageSpecialAttackChanceBonus,
      ),
      cardSpreadAttackChance: this.getEnragedChance(
        config.cardSpreadAttackChance,
        config.enrageCardSpreadAttackChanceBonus,
      ),
      cakeRainAttackChance: this.getEnragedChance(
        config.cakeRainAttackChance,
        config.enrageSpecialAttackChanceBonus,
      ),
      chargeAttackChance: this.getEnragedChance(
        config.chargeAttackChance,
        config.enrageChargeAttackChanceBonus,
      ),
    };
  }

  getEnragedChance(baseChance, bonus = 0) {
    if (typeof baseChance !== 'number') {
      return baseChance;
    }

    return Phaser.Math.Clamp(baseChance + bonus, 0, 0.9);
  }

  isBossEnraged(config = this.level.boss) {
    if (!this.bossFightActive || this.bossDefeated || this.bossMaxHp <= 0) {
      return false;
    }

    const threshold = config.enrageHealthRatio ?? 0;

    return threshold > 0 && this.bossHp / this.bossMaxHp <= threshold;
  }

  updateBossEnrageState() {
    const wasEnraged = this.bossEnrageActive;
    this.bossEnrageActive = this.isBossEnraged();

    if (!wasEnraged && this.bossEnrageActive && !this.bossEnrageAnnounced) {
      this.bossEnrageAnnounced = true;
      this.showToast('Boss wird aggressiv!');
    }
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

    const showPlatformNumbers = shouldShowPlatformNumbers();

    this.level.platforms.forEach((platform, index) => {
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

      if (showPlatformNumbers) {
        this.createPlatformNumberLabel(platform, index);
      }
    });
  }

  createMovingPlatforms() {
    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.level.movingPlatforms?.forEach((platform, index) => {
      const block = this.add
        .tileSprite(
          platform.x,
          platform.y,
          platform.width,
          platform.height,
          'platform-surface',
        )
        .setOrigin(0, 0)
        .setDepth(3);
      const distance = platform.distance ?? platform.move?.distance ?? 260;
      const speed = platform.speed ?? platform.move?.speed ?? MOVING_PLATFORM_DEFAULT_SPEED;
      const startX = platform.x;
      const endX = platform.x + distance;
      const direction = platform.direction === -1 ? -1 : 1;

      this.physics.add.existing(block);
      block.body
        .setAllowGravity(false)
        .setImmovable(true)
        .setSize(platform.width, platform.height, false);
      block.body.pushable = false;
      block.body.setVelocityX(speed * direction);
      block.setData('startX', Math.min(startX, endX));
      block.setData('endX', Math.max(startX, endX));
      block.setData('speed', speed);
      block.setData('direction', direction);
      block.setData('label', `M${index + 1}`);

      this.movingPlatforms.add(block);
    });
  }

  createFallingPlatforms() {
    this.fallingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.level.fallingPlatforms?.forEach((platform, index) => {
      const block = this.add
        .tileSprite(
          platform.x,
          platform.y,
          platform.width,
          platform.height,
          'platform-surface',
        )
        .setOrigin(0, 0)
        .setDepth(3)
        .setTint(0xcfd7da);

      this.physics.add.existing(block);
      block.body
        .setAllowGravity(false)
        .setImmovable(true)
        .setSize(platform.width, platform.height, false);
      block.body.pushable = false;
      block.setData('startX', platform.x);
      block.setData('startY', platform.y);
      block.setData('armed', false);
      block.setData('falling', false);
      block.setData('standTimer', null);
      block.setData('label', `F${index + 1}`);

      this.fallingPlatforms.add(block);
    });
  }

  createPlatformNumberLabel(platform, index) {
    const labelY = platform.height > PLATFORM_SURFACE_HEIGHT
      ? platform.y + PLATFORM_NUMBER_LABEL_OFFSET
      : platform.y + platform.height + PLATFORM_NUMBER_LABEL_OFFSET;

    this.add
      .text(platform.x + platform.width / 2, labelY, `P${index + 1}`, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#1d1d1dcc',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(30);
  }

  createPlatformVisual(platform) {
    const surfaceHeight = Math.min(PLATFORM_SURFACE_HEIGHT, platform.height);
    const dirtHeight = Math.max(platform.height - surfaceHeight, 0);

    const surface = this.add
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
      return [surface];
    }

    const dirt = this.add
      .tileSprite(
        platform.x,
        platform.y + surfaceHeight,
        platform.width,
        dirtHeight,
        'platform-dirt',
      )
      .setOrigin(0, 0)
      .setDepth(1);

    return [surface, dirt];
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
      const placement = this.resolveCheckpointPlacement(entry);
      const checkpoint = this.checkpoints.create(
        placement.x,
        placement.y,
        ...getTextureArgs('checkpoint'),
      );

      checkpoint
        .setOrigin(0.5, 1)
        .setDepth(7)
        .setData('spawn', this.resolveRespawnPoint(placement))
        .setData('label', entry.label)
        .setData('activated', false)
        .setTint(index === 0 ? 0xffb39d : 0xffffff);
      checkpoint.setData('logicalTextureKey', 'checkpoint');

      checkpoint.refreshBody();
      checkpoint.body.setSize(CHECKPOINT_TRIGGER_WIDTH, GAME_HEIGHT);
      checkpoint.body.setOffset(
        checkpoint.displayOriginX - CHECKPOINT_TRIGGER_WIDTH / 2,
        CHECKPOINT_TEXTURE_HEIGHT - placement.y,
      );
    });
  }

  createGoal() {
    const textureKey = this.shouldUseTreasureGoal()
      ? 'treasure-box-closed'
      : 'goal';
    const displaySize = this.getGoalDisplaySize();
    const goalY = this.level.goal.y + this.level.goal.height + this.getGoalFootSink();

    this.goal = this.shouldUseTreasureGoal()
      ? this.physics.add.staticSprite(
          this.level.goal.x,
          goalY,
          ...getTextureArgs(textureKey),
        )
      : this.physics.add.staticImage(
          this.level.goal.x,
          goalY,
          ...getTextureArgs(textureKey),
        );
    this.goal.setData('logicalTextureKey', textureKey);

    this.goal
      .setOrigin(0.5, 1)
      .setDisplaySize(displaySize.width, displaySize.height)
      .setDepth(7)
      .refreshBody();

    this.goal.disableBody(true, true);
  }

  shouldUseTreasureGoal() {
    return this.level.id === FINAL_TREASURE_LEVEL_ID;
  }

  getGoalDisplaySize() {
    if (!this.shouldUseTreasureGoal()) {
      return {
        width: this.level.goal.width,
        height: this.level.goal.height,
      };
    }

    const texture = this.textures.get('treasure-box-open');
    const sourceImage = texture.getSourceImage();

    return {
      width: TREASURE_BOX_DISPLAY_WIDTH,
      height: Math.round(TREASURE_BOX_DISPLAY_WIDTH * (sourceImage.height / sourceImage.width)),
    };
  }

  getGoalFootSink() {
    return this.shouldUseTreasureGoal() ? TREASURE_BOX_FOOT_SINK : 0;
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
      return this.level.trees
        .map((entry) => this.resolveNormalTreeEntry(entry))
        .filter(Boolean);
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

      return this.resolveNormalTreeEntry({
        x,
        y: platform.y,
        attackChance: TREE_NORMAL_ATTACK_CHANCE,
      });
    }).filter(Boolean);
  }

  resolveNormalTreeEntry(entry) {
    const platformTop = entry.y ?? this.getPlatformTopAt(entry.x) ?? this.level.spawn.y;
    const x = this.resolveTreeXAwayFromRespawns(entry.x, platformTop);

    if (x === null) {
      return null;
    }

    return {
      ...entry,
      x,
      y: platformTop,
    };
  }

  resolveTreeXAwayFromRespawns(x, platformTop) {
    const platform = this.getTreePlatform(x, platformTop);

    if (!platform) {
      return x;
    }

    const minX = platform.x + 70;
    const maxX = platform.x + platform.width - 70;
    let resolvedX = Phaser.Math.Clamp(x, minX, maxX);

    this.getLevelRespawnPoints()
      .filter((point) => Math.abs(point.y - platform.y) <= TREE_ATTACK_BOX_HEIGHT)
      .forEach((point) => {
        if (resolvedX === null) {
          return;
        }

        if (Math.abs(resolvedX - point.x) >= TREE_NORMAL_RESPAWN_PADDING) {
          return;
        }

        const leftX = point.x - TREE_NORMAL_RESPAWN_PADDING;
        const rightX = point.x + TREE_NORMAL_RESPAWN_PADDING;
        const candidates = [leftX, rightX]
          .filter((candidateX) => candidateX >= minX && candidateX <= maxX)
          .sort((a, b) => Math.abs(a - resolvedX) - Math.abs(b - resolvedX));

        if (candidates.length > 0) {
          resolvedX = candidates[0];
          return;
        }

        resolvedX = null;
      });

    return resolvedX;
  }

  getTreePlatform(x, platformTop) {
    return this.level.platforms.find((platform) => (
      x >= platform.x &&
      x <= platform.x + platform.width &&
      Math.abs(platform.y - platformTop) <= TREE_ATTACK_BOX_HEIGHT
    ));
  }

  getLevelRespawnPoints() {
    const checkpointRespawns = this.level.checkpoints.map((entry) => (
      this.resolveRespawnPoint(this.resolveCheckpointPlacement(entry))
    ));

    return [
      this.resolveRespawnPoint(this.level.spawn),
      ...checkpointRespawns,
    ];
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
      .text(HUD_TEXT_X, 108, '', {
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
    this.updateHudHelpText();
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
      this.awaitingBossRetry ||
      this.finalTreasureSequenceActive
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
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(
      this.player,
      this.fallingPlatforms,
      this.handleFallingPlatformContact,
      null,
      this,
    );
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.collider(this.projectiles, this.platforms, this.destroyProjectile, null, this);
    this.physics.add.collider(this.projectiles, this.movingPlatforms, this.destroyProjectile, null, this);
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
      this.isPlayerInTreeAttackBox,
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
    this.updateHudHelpText();
    this.updateMovingPlatforms();
    this.updateFallingPlatforms();

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
    this.checkBossUnstickSlide();
    this.enforceBossArenaBounds();
    this.updateProjectiles();
    this.updateTrees();
    this.updateBossTrees();
    this.updateFirstAidKitSpawns();
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
      this.playerBossStompConsumed = false;
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

  updateMovingPlatforms() {
    this.movingPlatforms?.children.each((platform) => {
      const startX = platform.getData('startX');
      const endX = platform.getData('endX');
      const speed = platform.getData('speed');
      const velocityX = platform.body.velocity.x;

      if (velocityX > 0 && platform.x >= endX) {
        platform.x = endX;
        platform.body.setVelocityX(-speed);
      } else if (velocityX < 0 && platform.x <= startX) {
        platform.x = startX;
        platform.body.setVelocityX(speed);
      } else if (velocityX === 0) {
        const direction = platform.getData('direction') ?? 1;
        platform.body.setVelocityX(speed * direction);
      }
    });
  }

  updateFallingPlatforms() {
    this.fallingPlatforms?.children.each((platform) => {
      if (
        platform.active &&
        platform.getData('falling') &&
        platform.y > this.level.worldHeight + FALL_LIMIT_PADDING
      ) {
        platform.body.enable = false;
        platform.setActive(false).setVisible(false);
      }
    });
  }

  handleFallingPlatformContact(player, platform) {
    if (
      this.levelComplete ||
      this.isRespawning ||
      platform.getData('armed') ||
      platform.getData('falling') ||
      !player.body.touching.down ||
      !platform.body.touching.up
    ) {
      return;
    }

    this.armFallingPlatform(platform);
  }

  armFallingPlatform(platform) {
    platform.setData('armed', true);

    const standTimer = this.time.delayedCall(FALLING_PLATFORM_STAND_DELAY_MS, () => {
      platform.setData('standTimer', null);

      if (!this.isPlayerStandingOnFallingPlatform(platform)) {
        platform.setData('armed', false);
        return;
      }

      this.warnFallingPlatform(platform);
    });

    platform.setData('standTimer', standTimer);
  }

  isPlayerStandingOnFallingPlatform(platform) {
    if (!this.player?.body || !platform?.body) {
      return false;
    }

    const playerBody = this.player.body;
    const platformBody = platform.body;
    const horizontalOverlap =
      playerBody.right > platformBody.left + 8 &&
      playerBody.left < platformBody.right - 8;
    const standingHeight =
      playerBody.bottom >= platformBody.top - 4 &&
      playerBody.bottom <= platformBody.top + 18;

    return horizontalOverlap && standingHeight && playerBody.velocity.y >= -20;
  }

  warnFallingPlatform(platform) {
    const startX = platform.getData('startX');

    this.tweens.add({
      targets: platform,
      x: startX + FALLING_PLATFORM_WOBBLE_OFFSET,
      duration: FALLING_PLATFORM_WOBBLE_STEP_MS,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: Math.floor(FALLING_PLATFORM_WOBBLE_MS / (FALLING_PLATFORM_WOBBLE_STEP_MS * 2)),
      onComplete: () => this.dropFallingPlatform(platform),
    });
  }

  dropFallingPlatform(platform) {
    if (!platform.active || platform.getData('falling')) {
      return;
    }

    platform.setData('falling', true);
    platform.clearTint();
    platform.body
      .setAllowGravity(true)
      .setImmovable(false)
      .setVelocity(0, FALLING_PLATFORM_DROP_SPEED);
    platform.body.pushable = false;
  }

  resetFallingPlatforms() {
    this.fallingPlatforms?.children.each((platform) => {
      const startX = platform.getData('startX');
      const startY = platform.getData('startY');
      const standTimer = platform.getData('standTimer');

      standTimer?.remove(false);
      this.tweens.killTweensOf(platform);
      platform.setActive(true).setVisible(true);
      platform
        .setPosition(startX, startY)
        .setAngle(0)
        .setTint(0xcfd7da);
      platform.body.enable = true;
      platform.body.reset(startX, startY);
      platform.body
        .setAllowGravity(false)
        .setImmovable(true)
        .setVelocity(0, 0);
      platform.body.pushable = false;
      platform.setData('armed', false);
      platform.setData('falling', false);
      platform.setData('standTimer', null);
    });
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
    this.playerBossStompConsumed = false;
    this.bossEnrageActive = false;
    this.bossEnrageAnnounced = false;
    this.bossRainAttackActive = false;
    this.clearPaintPuddles();
    this.clearBossTrees();
    this.clearFirstAidKits();
    this.firstAidKitSpawnsThisFight = 0;
    this.nextFirstAidKitSpawnAt = this.time.now + FIRST_AID_KIT_SPAWN_INITIAL_DELAY_MS;
    this.playerMaxHp = this.getPlayerBossMaxHp();
    this.bossMaxHp = this.getBossMaxHp();
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
    this.bossUnstickOverlapStartedAt = 0;
    this.nextBossUnstickSlideAt = 0;
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

    this.bossRetryCount += 1;
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

  getBossRetryEaseRatio() {
    const retryCount = this.bossRetryCount ?? 0;

    if (retryCount <= 0) {
      return 0;
    }

    return Phaser.Math.Clamp(
      BOSS_RETRY_EASE_FIRST_STEP + (retryCount - 1) * BOSS_RETRY_EASE_STEP,
      0,
      BOSS_RETRY_EASE_MAX,
    );
  }

  getEasedBossChance(baseChance) {
    return baseChance * (1 - this.getBossRetryEaseRatio());
  }

  getEasedBossCooldown(baseCooldown) {
    return Math.round(baseCooldown * (1 + this.getBossRetryEaseRatio()));
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
      this.level.worldHeight / 2,
      'platform-hitbox',
    );

    wall
      .setDisplaySize(BOSS_ARENA_BOUNDARY_WIDTH, this.level.worldHeight + GAME_HEIGHT * 2)
      .setVisible(false)
      .refreshBody();

    return wall;
  }

  enforceBossArenaBounds() {
    if (
      (!this.bossFightActive && !this.bossIntroActive && !this.bossCountdownActive) ||
      this.bossDefeated ||
      !this.arenaLeftWall ||
      !this.arenaRightWall ||
      !this.player?.body
    ) {
      return;
    }

    const innerLeft = this.level.boss.arenaLeft + BOSS_ARENA_BOUNDARY_WIDTH / 2;
    const innerRight = this.level.boss.arenaRight - BOSS_ARENA_BOUNDARY_WIDTH / 2;
    let nextX = this.player.x;

    if (this.player.body.left < innerLeft) {
      nextX += innerLeft - this.player.body.left;
      this.player.setVelocityX(Math.max(0, this.player.body.velocity.x));
    } else if (this.player.body.right > innerRight) {
      nextX -= this.player.body.right - innerRight;
      this.player.setVelocityX(Math.min(0, this.player.body.velocity.x));
    }

    if (nextX !== this.player.x) {
      this.player.setX(nextX);
      this.player.body.updateFromGameObject();
    }
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

  playRetrySound(config = getNextRetrySoundConfig(), attempt = 0) {
    const maxAttempts = 2;

    if (!config?.key) {
      return;
    }

    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this.awaitingBossRetry && !this.activeRetrySound) {
          this.playRetrySound(config, attempt + 1);
        }
      });
      return;
    }

    if (!this.cache.audio.exists(config.key)) {
      const fallbackConfig = RETRY_SOUNDS.find((entry) => this.cache.audio.exists(entry.key));

      if (fallbackConfig && fallbackConfig.key !== config.key) {
        this.playRetrySound(fallbackConfig, attempt + 1);
      }

      return;
    }

    this.sound.context?.resume?.();

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

      if (attempt < maxAttempts) {
        this.time.delayedCall(120, () => {
          if (this.awaitingBossRetry && !this.activeRetrySound) {
            this.playRetrySound(config, attempt + 1);
          }
        });
      }

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
    if (
      !this.bossFightActive ||
      this.bossDefeated ||
      this.bossIntroActive ||
      this.bossIsHit ||
      this.playerBossStompConsumed ||
      this.bossState === 'dodge'
    ) {
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
    if (this.playerBossStompConsumed || !this.isPlayerInBossStompZone()) {
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
      Math.random() > this.getEasedBossChance(bossConfig.dodgeChance ?? 0)
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
      this.time.now + this.getEasedBossCooldown(
        bossConfig.dodgeAttackCooldown ?? bossConfig.attackCooldown,
      ),
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

    if (this.shouldStartCakeRainAttack(bossConfig)) {
      this.startCakeRainAttack(bossConfig);
      return;
    }

    const attackConfig = this.resolveBossAttackConfig(bossConfig);

    this.bossState = 'attack';
    this.boss.setVelocityX(0);
    this.boss.setFlipX(this.player.x < this.boss.x);
    this.setBossScaleForAnimation(attackConfig.animationKey);
    this.setBossAnimationTimeScale(1);
    this.boss.play(attackConfig.animationKey, true);
    this.alignBossToFloor();
    this.nextBossAttackAt = this.time.now + this.getEasedBossCooldown(bossConfig.attackCooldown);
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
      Math.random() <= this.getEasedBossChance(
        this.getBossSpecialAttackChance(bossConfig.specialAttackChance ?? CARD_SPREAD_ATTACK_CHANCE),
      );
  }

  shouldStartCakeRainAttack(bossConfig) {
    if (typeof bossConfig.cakeRainAttackChance !== 'number') {
      return false;
    }

    return Math.random() <= this.getEasedBossChance(
      this.getBossSpecialAttackChance(bossConfig.cakeRainAttackChance),
    );
  }

  startCakeRainAttack(bossConfig) {
    const projectileCount = bossConfig.cakeRainProjectileCount ?? CAKE_RAIN_PROJECTILE_COUNT;
    const projectileDelay = bossConfig.cakeRainProjectileDelay ?? CAKE_RAIN_PROJECTILE_DELAY_MS;
    const fallSpeed = bossConfig.cakeRainFallSpeed ?? CAKE_RAIN_FALL_SPEED;
    const rainDuration = this.getCakeRainAttackDuration(projectileCount, projectileDelay, fallSpeed);

    this.bossRainAttackActive = true;
    this.bossState = 'attack';
    this.boss.setVelocityX(0);
    this.boss.setFlipX(this.player.x < this.boss.x);
    this.setBossScaleForAnimation(this.getBossKey('attack'));
    this.setBossAnimationTimeScale(1);
    this.boss.play(this.getBossKey('attack'), true);
    this.alignBossToFloor();
    this.nextBossAttackAt = this.time.now + Math.max(
      this.getEasedBossCooldown(bossConfig.cakeRainCooldown ?? bossConfig.attackCooldown),
      rainDuration,
    );
    this.playBossShotSfx();
    this.showToast(bossConfig.cakeRainToast ?? 'Tortenregen!');

    const laneOrder = Array.from({ length: projectileCount }, (_, laneIndex) => laneIndex);
    Phaser.Utils.Array.Shuffle(laneOrder);

    for (let index = 0; index < projectileCount; index += 1) {
      this.time.delayedCall(index * projectileDelay, () => {
        if (this.bossFightActive && !this.bossDefeated && !this.awaitingBossRetry) {
          this.createCakeRainProjectile(bossConfig, laneOrder[index], projectileCount);
        }
      });
    }

    this.time.delayedCall(rainDuration, () => {
      this.bossRainAttackActive = false;
    });

    this.boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.bossDefeated && this.bossFightActive) {
        this.bossState = 'patrol';
      }
    });
  }

  getCakeRainAttackDuration(projectileCount, projectileDelay, fallSpeed) {
    const spawnDuration = Math.max(0, projectileCount - 1) * projectileDelay;
    const fallDistance = GAME_HEIGHT + 80 - CAKE_RAIN_SPAWN_TOP_PADDING;
    const fallDuration = Math.ceil((fallDistance / Math.max(1, fallSpeed)) * 1000);

    return spawnDuration + fallDuration;
  }

  createCakeRainProjectile(bossConfig, laneIndex, projectileCount) {
    const textureKey = this.getBossKey('shot');
    const minX = bossConfig.arenaLeft + CAKE_RAIN_ARENA_MARGIN;
    const maxX = bossConfig.arenaRight - CAKE_RAIN_ARENA_MARGIN;
    const laneSpacing = projectileCount > 1 ? (maxX - minX) / (projectileCount - 1) : 0;
    const laneX = projectileCount > 1
      ? minX + laneSpacing * laneIndex
      : (minX + maxX) / 2;
    const jitter = Math.round(laneSpacing * CAKE_RAIN_LANE_JITTER_MULTIPLIER);
    const laneXWithJitter = Phaser.Math.Clamp(
      laneX + Phaser.Math.Between(-jitter, jitter),
      minX,
      maxX,
    );
    const x = this.getCakeRainSpawnXOutsideBoss(
      laneXWithJitter,
      minX,
      maxX,
      bossConfig,
    );
    const y = Math.max(
      CAKE_RAIN_SPAWN_TOP_PADDING,
      bossConfig.floorY - GAME_HEIGHT + CAKE_RAIN_SPAWN_TOP_PADDING,
    );
    const projectile = this.projectiles
      .create(x, y, ...getTextureArgs(textureKey))
      .setOrigin(0.5)
      .setScale(bossConfig.cakeRainShotScale ?? bossConfig.shotScale)
      .setAngle(bossConfig.cakeRainShotAngle ?? CAKE_RAIN_ROTATION_DEGREES)
      .setDepth(8);

    projectile.body.setAllowGravity(false);
    this.centerProjectileBody(projectile, textureKey, {
      ...bossConfig,
      shotBodyWidth: bossConfig.cakeRainShotBodyWidth ?? bossConfig.shotBodyWidth,
      shotBodyHeight: bossConfig.cakeRainShotBodyHeight ?? bossConfig.shotBodyHeight,
      shotBodyOffsetY: bossConfig.cakeRainShotBodyOffsetY ?? bossConfig.shotBodyOffsetY,
    });
    projectile.setVelocity(0, bossConfig.cakeRainFallSpeed ?? CAKE_RAIN_FALL_SPEED);
    projectile.setData('cakeRain', true);
    projectile.setData('damage', bossConfig.cakeRainDamage ?? bossConfig.damage);
    projectile.setData('logicalTextureKey', textureKey);

    return projectile;
  }

  getCakeRainSpawnXOutsideBoss(x, minX, maxX, bossConfig) {
    const clearRadius = bossConfig.cakeRainBossClearRadius ?? Math.max(
      CAKE_RAIN_BOSS_CLEAR_RADIUS,
      this.boss.displayWidth * 0.35,
    );
    const clearLeft = this.boss.x - clearRadius;
    const clearRight = this.boss.x + clearRadius;

    if (x < clearLeft || x > clearRight) {
      return x;
    }

    const pushLeft = clearLeft - minX > maxX - clearRight;
    const safeX = pushLeft
      ? clearLeft - Phaser.Math.Between(16, 48)
      : clearRight + Phaser.Math.Between(16, 48);

    return Phaser.Math.Clamp(safeX, minX, maxX);
  }

  scheduleBossAttackProjectile(attackConfig) {
    const projectileFrame = attackConfig.projectileFrame;
    const canFire = () => this.bossFightActive &&
      !this.bossDefeated &&
      this.bossState === 'attack' &&
      !this.bossRainAttackActive;

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
    const bossConfig = this.getBossConfig();

    return this.level.id === CHARGE_ATTACK_BOSS_ID &&
      this.anims.exists(this.getBossKey('charge')) &&
      Math.random() <= this.getEasedBossChance(
        this.getBossSpecialAttackChance(bossConfig.chargeAttackChance ?? CHARGE_ATTACK_CHANCE),
      );
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
    this.nextBossAttackAt = this.time.now +
      this.getEasedBossCooldown(this.getBossConfig().attackCooldown);

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
    if (this.bossRainAttackActive) {
      return;
    }

    const direction = this.player.x < this.boss.x ? -1 : 1;
    const bossConfig = attackConfig;
    const textureKey = attackConfig.projectileTextureKey ?? this.getBossKey('shot');
    const cardSpreadChance = bossConfig.cardSpreadAttackChance ?? CARD_SPREAD_ATTACK_CHANCE;
    const useCardSpread = this.shouldUseBossCardSpread() &&
      Math.random() <= this.getEasedBossChance(
        this.getBossSpecialAttackChance(cardSpreadChance),
      );

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

      if (projectile.getData('cakeRain')) {
        if (projectile.y >= this.getBossConfig().floorY + 80) {
          projectile.destroy();
        }
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
    return this.isPlayerInTreeAttackBox(this.player, tree);
  }

  getTreeAttackBox(tree) {
    const width = tree.displayWidth * TREE_ATTACK_BOX_WIDTH_MULTIPLIER;
    const height = TREE_ATTACK_BOX_HEIGHT;

    return new Phaser.Geom.Rectangle(
      tree.x - width / 2,
      tree.y - height,
      width,
      height,
    );
  }

  isPlayerInTreeAttackBox(player, tree) {
    if (!tree?.active || !tree?.body?.enable || !player?.body) {
      return false;
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(
        player.body.x,
        player.body.y,
        player.body.width,
        player.body.height,
      ),
      this.getTreeAttackBox(tree),
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
      attackChance: this.getEasedBossChance(TREE_BOSS_ATTACK_CHANCE),
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

  updateFirstAidKitSpawns() {
    if (
      !this.bossFightActive ||
      this.bossDefeated ||
      this.bossIntroActive ||
      this.bossCountdownActive ||
      this.awaitingBossRetry ||
      this.playerHp > FIRST_AID_KIT_HEALTH_THRESHOLD ||
      this.bossHp <= this.bossMaxHp * FIRST_AID_KIT_BOSS_MIN_HEALTH_RATIO ||
      this.firstAidKitSpawnsThisFight >= FIRST_AID_KIT_MAX_SPAWNS_PER_FIGHT ||
      this.hasActiveFirstAidKit() ||
      this.time.now < this.nextFirstAidKitSpawnAt
    ) {
      return;
    }

    this.nextFirstAidKitSpawnAt = this.time.now + FIRST_AID_KIT_SPAWN_COOLDOWN_MS;

    if (Math.random() > FIRST_AID_KIT_SPAWN_CHANCE) {
      return;
    }

    this.spawnFirstAidKit();
  }

  hasActiveFirstAidKit() {
    if (!this.collectibles) {
      return false;
    }

    return this.collectibles.children.entries.some((pickup) => (
      pickup.active && pickup.getData('pickupType') === 'firstAidKit'
    ));
  }

  spawnFirstAidKit() {
    const bossConfig = this.getBossConfig();
    const x = this.getFirstAidKitSpawnX(bossConfig);

    if (x === null) {
      return;
    }

    const source = this.textures.get('first-aid-kit').getSourceImage();
    const displayWidth = source.width * (FIRST_AID_KIT_DISPLAY_HEIGHT / source.height);
    const pickup = this.collectibles
      .create(x, bossConfig.floorY - FIRST_AID_KIT_FOOT_OFFSET, ...getTextureArgs('first-aid-kit'))
      .setOrigin(0.5, 1)
      .setDisplaySize(displayWidth, FIRST_AID_KIT_DISPLAY_HEIGHT)
      .setDepth(9)
      .setAlpha(0);

    pickup.body.setAllowGravity(false);
    pickup.body.setImmovable(true);
    pickup.setData('logicalTextureKey', 'first-aid-kit');
    pickup.setData('pickupType', 'firstAidKit');
    pickup.setData('healAmount', FIRST_AID_KIT_HEAL_AMOUNT);
    pickup.setData('baseY', pickup.y);
    this.firstAidKitSpawnsThisFight += 1;

    this.tweens.add({
      targets: pickup,
      alpha: 1,
      duration: 180,
      ease: 'Quad.out',
    });
    this.tweens.add({
      targets: pickup,
      y: pickup.y - 8,
      duration: 850,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  getFirstAidKitSpawnX(bossConfig) {
    const minX = bossConfig.arenaLeft + FIRST_AID_KIT_ARENA_MARGIN;
    const maxX = bossConfig.arenaRight - FIRST_AID_KIT_ARENA_MARGIN;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const x = Phaser.Math.Between(minX, maxX);

      if (this.isFirstAidKitSpawnSafe(x)) {
        return x;
      }
    }

    const directions = this.player.x < (minX + maxX) / 2 ? [1, -1] : [-1, 1];

    for (const direction of directions) {
      const x = Phaser.Math.Clamp(
        this.player.x + direction * FIRST_AID_KIT_PLAYER_SAFE_DISTANCE,
        minX,
        maxX,
      );

      if (this.isFirstAidKitSpawnSafe(x)) {
        return x;
      }
    }

    return null;
  }

  isFirstAidKitSpawnSafe(x) {
    return Math.abs(x - this.player.x) >= FIRST_AID_KIT_PLAYER_SAFE_DISTANCE &&
      Math.abs(x - this.boss.x) >= FIRST_AID_KIT_BOSS_SAFE_DISTANCE;
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

      const attackChance = tree.getData('attackChance') ??
        this.getEasedBossChance(TREE_BOSS_ATTACK_CHANCE);

      if (Math.random() > attackChance) {
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

  clearFirstAidKits() {
    this.nextFirstAidKitSpawnAt = 0;
    this.collectibles?.children.each((pickup) => {
      if (pickup.getData('pickupType') !== 'firstAidKit') {
        return;
      }

      this.tweens.killTweensOf(pickup);
      pickup.destroy();
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
    const spawnChance = this.getPaintPuddleSpawnChance();

    if (
      !this.shouldUseBossPaintPuddles() ||
      this.hasActivePaintPuddle() ||
      this.isPaintPuddleSpawnOnCooldown() ||
      Math.random() > this.getBossSpecialAttackChance(spawnChance)
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
    const spawnChance = this.getPaintPuddleSpawnChance();

    if (
      !this.shouldUseBossPaintPuddles() ||
      !this.bossFightActive ||
      !projectile?.active ||
      this.hasActivePaintPuddle() ||
      this.isPaintPuddleSpawnOnCooldown() ||
      Math.random() > this.getBossSpecialAttackChance(spawnChance)
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

  resolveCheckpointPlacement(entry) {
    const platform = this.getCheckpointPlatform(entry);

    if (!platform) {
      return {
        x: entry.x,
        y: entry.y + CHECKPOINT_TEXTURE_HEIGHT,
      };
    }

    const minX = platform.x + CHECKPOINT_PLATFORM_EDGE_PADDING;
    const maxX = platform.x + platform.width - CHECKPOINT_PLATFORM_EDGE_PADDING;
    const x = minX <= maxX
      ? Phaser.Math.Clamp(entry.x, minX, maxX)
      : platform.x + platform.width / 2;

    return {
      x,
      y: platform.y,
    };
  }

  getCheckpointPlatform(entry) {
    const preferredTop = Number.isFinite(entry.y)
      ? entry.y + CHECKPOINT_TEXTURE_HEIGHT
      : null;

    return this.level.platforms
      .map((platform) => {
        const platformRight = platform.x + platform.width;
        const distance = entry.x < platform.x
          ? platform.x - entry.x
          : Math.max(0, entry.x - platformRight);

        return { platform, distance };
      })
      .filter(({ distance }) => distance <= CHECKPOINT_PLATFORM_SNAP_DISTANCE)
      .sort((left, right) => {
        const distanceDiff = left.distance - right.distance;
        if (distanceDiff !== 0) {
          return distanceDiff;
        }

        if (preferredTop !== null) {
          const leftTopDiff = Math.abs(left.platform.y - preferredTop);
          const rightTopDiff = Math.abs(right.platform.y - preferredTop);
          if (leftTopDiff !== rightTopDiff) {
            return leftTopDiff - rightTopDiff;
          }
        }

        return right.platform.width - left.platform.width;
      })[0]?.platform ?? null;
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

  getPaintPuddleSpawnChance() {
    return this.getBossConfig().paintPuddleSpawnChance ??
      PAINT_PUDDLE_SPAWN_CHANCE;
  }

  getBossSpecialAttackChance(baseChance) {
    const reductionPerBall = this.getBossConfig().specialAttackReductionPerBall ??
      BOSS_SPECIAL_ATTACK_REDUCTION_PER_BALL;

    return Phaser.Math.Clamp(
      baseChance - this.levelBallsCollected * reductionPerBall,
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
    if (
      this.playerBossContactDamageArmed ||
      this.playerIsHit ||
      this.isRespawning ||
      this.time.now < this.nextBossContactDamageAt
    ) {
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
      !this.playerBossStompConsumed &&
      player.body.velocity.y > 80 &&
      this.isPlayerInBossStompZone();

    if (playerCanHit) {
      this.resolveBossStompAttempt();
      return;
    }

    if (this.isPlayerSafelyAboveBoss(player, boss)) {
      return;
    }

    if (!this.playerBossContactDamageArmed) {
      return;
    }

    if (this.time.now < this.nextBossContactDamageAt) {
      return;
    }

    this.playerBossContactDamageArmed = false;
    this.nextBossContactDamageAt = this.time.now + BOSS_CONTACT_DAMAGE_REARM_MS;
    this.damagePlayer(this.getBossConfig().damage);
    this.knockPlayerAwayFromBoss(player, boss);

    if (this.bossState === 'charge') {
      this.endBossChargeAttack();
    }
  }

  checkBossUnstickSlide() {
    if (
      !this.bossFightActive ||
      this.bossDefeated ||
      this.bossIntroActive ||
      this.bossCountdownActive ||
      this.bossState === 'dodge' ||
      this.bossIsHit ||
      this.playerIsHit ||
      this.isRespawning ||
      !this.player?.body ||
      !this.boss?.body?.enable
    ) {
      this.bossUnstickOverlapStartedAt = 0;
      return;
    }

    if (!this.arePlayerAndBossContactBoundsOverlapping()) {
      this.bossUnstickOverlapStartedAt = 0;
      return;
    }

    const playerCanHit =
      !this.bossIsHit &&
      !this.playerBossStompConsumed &&
      this.player.body.velocity.y > 80 &&
      this.isPlayerInBossStompZone();

    if (playerCanHit) {
      this.bossUnstickOverlapStartedAt = 0;
      this.resolveBossStompAttempt();
      return;
    }

    if (this.isPlayerSafelyAboveBoss(this.player, this.boss)) {
      this.bossUnstickOverlapStartedAt = 0;
      return;
    }

    if (!this.bossUnstickOverlapStartedAt) {
      this.bossUnstickOverlapStartedAt = this.time.now;
      return;
    }

    if (this.time.now - this.bossUnstickOverlapStartedAt < BOSS_UNSTICK_OVERLAP_GRACE_MS) {
      return;
    }

    if (this.time.now < this.nextBossUnstickSlideAt) {
      return;
    }

    this.slideBossAwayFromPlayer();
  }

  slideBossAwayFromPlayer() {
    const bossConfig = this.getBossConfig();
    const arenaLeft = bossConfig.arenaLeft + BOSS_DODGE_EDGE_MARGIN;
    const arenaRight = bossConfig.arenaRight - BOSS_DODGE_EDGE_MARGIN;
    const awayFromPlayer = this.player.x < this.boss.x ? 1 : -1;
    const targetAwayX = this.boss.x + awayFromPlayer * BOSS_DODGE_MIN_SPACE;
    const direction = targetAwayX >= arenaLeft && targetAwayX <= arenaRight
      ? awayFromPlayer
      : -awayFromPlayer;

    if (this.bossState === 'charge') {
      this.endBossChargeAttack();
    }

    this.bossState = 'dodge';
    this.bossDodgeStartedAt = this.time.now;
    this.bossDodgeDirection = direction;
    this.bossUnstickOverlapStartedAt = 0;
    this.nextBossUnstickSlideAt = this.time.now + BOSS_UNSTICK_SLIDE_COOLDOWN_MS;
    this.nextBossAttackAt = Math.max(this.nextBossAttackAt, this.time.now + 650);
    this.bossDirection = direction;
    this.boss.setFlipX(direction < 0);
    this.boss.setVelocityX(direction * (bossConfig.dodgeSpeed ?? 720));
    this.setBossAnimationTimeScale(BOSS_DODGE_ANIMATION_TIME_SCALE);
    this.boss.play(this.getBossKey('move'), true);
    this.alignBossToFloor();
  }

  arePlayerAndBossContactBoundsOverlapping() {
    const bossBounds = this.getBossContactWorldBounds();

    if (!bossBounds) {
      return this.arePlayerAndBossBodiesOverlapping();
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(
        this.player.body.x,
        this.player.body.y,
        this.player.body.width,
        this.player.body.height,
      ),
      bossBounds,
    );
  }

  getBossContactWorldBounds() {
    if (!this.boss) {
      return null;
    }

    const textureKey = getLogicalTextureKey(this.boss);
    const bounds = this.getTextureContentBounds(textureKey);
    const scaleX = Math.abs(this.boss.scaleX);
    const scaleY = Math.abs(this.boss.scaleY);

    return new Phaser.Geom.Rectangle(
      this.boss.x - (this.boss.width * scaleX * this.boss.originX) + bounds.x * scaleX,
      this.boss.y - (this.boss.height * scaleY * this.boss.originY) + bounds.y * scaleY,
      bounds.width * scaleX,
      bounds.height * scaleY,
    );
  }

  isPlayerSafelyAboveBoss(player, boss) {
    if (!player.body) {
      return player.y < boss.y - BOSS_CONTACT_DAMAGE_HEIGHT;
    }

    const bossContactBounds = this.getBossContactWorldBounds();
    const playerBottom = player.body.bottom;
    const bossTop = bossContactBounds?.top ?? boss.body?.top ?? boss.y;

    return player.body.velocity.y <= 80 &&
      playerBottom <= bossTop + BOSS_CONTACT_SAFE_TOP_MARGIN;
  }

  knockPlayerAwayFromBoss(player, boss) {
    if (!player.body) {
      return;
    }

    const direction = player.x < boss.x ? -1 : 1;
    player.setVelocity(
      direction * BOSS_CONTACT_KNOCKBACK_X,
      Math.min(player.body.velocity.y, BOSS_CONTACT_KNOCKBACK_Y),
    );
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

    this.updateBossEnrageState();
    this.bossIsHit = true;
    this.playerBossStompConsumed = true;
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

    this.shiftBossAfterHit();

    this.time.delayedCall(BOSS_HIT_LOCK_MS, () => {
      this.bossIsHit = false;
      if (this.bossFightActive && !this.bossDefeated) {
        this.setBossStateScale();
        this.alignBossToFloor();
        this.bossState = 'patrol';
      }
    });
  }

  shiftBossAfterHit() {
    const bossConfig = this.getBossConfig();
    const minX = bossConfig.arenaLeft + BOSS_DODGE_EDGE_MARGIN;
    const maxX = bossConfig.arenaRight - BOSS_DODGE_EDGE_MARGIN;
    const awayFromPlayer = this.player.x < this.boss.x ? 1 : -1;
    const distance = Phaser.Math.Between(BOSS_POST_HIT_SHIFT_MIN, BOSS_POST_HIT_SHIFT_MAX);
    let targetX = Phaser.Math.Clamp(this.boss.x + awayFromPlayer * distance, minX, maxX);

    if (Math.abs(targetX - this.boss.x) < BOSS_POST_HIT_SHIFT_MIN * 0.5) {
      targetX = Phaser.Math.Clamp(this.boss.x - awayFromPlayer * distance, minX, maxX);
    }

    this.bossDirection = targetX < this.boss.x ? -1 : 1;
    this.boss.setFlipX(this.bossDirection < 0);
    this.tweens.killTweensOf(this.boss);
    this.tweens.add({
      targets: this.boss,
      x: targetX,
      duration: BOSS_POST_HIT_SHIFT_DURATION_MS,
      ease: 'Quad.out',
      onUpdate: () => this.alignBossToFloor(),
      onComplete: () => {
        this.alignBossToFloor();
        this.configureBossBody();
      },
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
    const bossConfig = this.getBossConfig();
    const baseChance = bossConfig.critChance ??
      BOSS_CRIT_BASE_CHANCE + (this.level.id - 1) * BOSS_CRIT_CHANCE_PER_LEVEL;
    const maxChance = bossConfig.maxCritChance ?? BOSS_CRIT_MAX_CHANCE;
    const ballCritReduction = this.levelBallsCollected *
      (bossConfig.critReductionPerBall ?? BOSS_CRIT_REDUCTION_PER_BALL);

    return Phaser.Math.Clamp(
      baseChance - ballCritReduction,
      0,
      maxChance,
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
    this.playerBossStompConsumed = false;
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
    this.clearFirstAidKits();
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
    this.playerBossStompConsumed = false;
    this.bossState = 'intro';
    this.nextBossAttackAt = 0;
    this.nextBossContactDamageAt = 0;
    this.bossUnstickOverlapStartedAt = 0;
    this.nextBossUnstickSlideAt = 0;
    this.bossBodyBounds = null;
    this.bossBodyTextureKey = null;
    this.boss.setVelocity(0, 0);
    this.boss.stop();
    this.clearProjectiles();
    this.clearPaintPuddles();
    this.clearBossTrees();
    this.clearFirstAidKits();
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
    this.playerBossStompConsumed = false;
    this.bossIsHit = false;
    this.bossState = 'stand';
    this.nextBossAttackAt = 0;
    this.nextBossContactDamageAt = 0;
    this.bossUnstickOverlapStartedAt = 0;
    this.nextBossUnstickSlideAt = 0;
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
    this.clearFirstAidKits();
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

    if (pickupType === 'firstAidKit') {
      const healAmount = pickup.getData('healAmount') ?? FIRST_AID_KIT_HEAL_AMOUNT;
      const healed = Math.max(0, Math.min(healAmount, this.playerMaxHp - this.playerHp));

      this.tweens.killTweensOf(pickup);
      pickup.disableBody(true, true);

      if (healed > 0) {
        this.playerHp += healed;
        this.refreshHealthBars();
      }

      this.playCoinSfx();
      this.showToast(healed > 0 ? `+${healed} Leben` : 'Leben voll');
      return;
    }

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
    const baseHp = this.getBossConfig().playerHp ?? BOSS_BASE_HP;
    const roundedBonus = Math.floor(this.levelCoinHpBonus);
    const maxRoundedBonus = Math.floor(this.level.coins.length * COIN_PLAYER_HP_BONUS);

    return Phaser.Math.Clamp(
      baseHp + roundedBonus,
      baseHp,
      baseHp + maxRoundedBonus,
    );
  }

  getBossMaxHp() {
    const baseHp = this.getBossConfig().hp ?? BOSS_BASE_HP + this.level.coins.length;
    const retryReduction = this.getBossRetryEaseRatio();

    return Math.max(1, Math.round(baseHp * (1 - retryReduction)));
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

    if (this.shouldUseTreasureGoal()) {
      this.startFinalTreasureSequence();
      return;
    }

    this.finishLevel();
  }

  finishLevel() {
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

  startFinalTreasureSequence() {
    if (this.finalTreasureSequenceActive) {
      return;
    }

    this.finalTreasureSequenceActive = true;
    this.levelComplete = true;
    this.player.setVelocity(0, 0);
    this.player.stop();
    setSpriteTexture(this.player, 'char-stand');
    this.playerState = 'stand';
    this.player.setFlipX(false);
    this.player.body.enable = false;
    this.setLevelHudVisible(false);
    this.playFinalTreasureMusic();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }

    this.refreshHud();
    this.openFinalTreasureBox();
  }

  openFinalTreasureBox() {
    const showTreasure = () => {
      setSpriteTexture(this.goal, 'treasure-box-open');
      const displaySize = this.getGoalDisplaySize();
      this.goal.setDisplaySize(displaySize.width, displaySize.height);
      this.goal.refreshBody();
      this.showFinalTreasureReveal();
    };

    if (this.goal?.play && this.anims.exists(TREASURE_BOX_ANIMATION_KEY)) {
      this.goal.play(TREASURE_BOX_ANIMATION_KEY, true);
      this.goal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, showTreasure);
      return;
    }

    showTreasure();
  }

  stopLevelMusic() {
    this.musicControls?.panel?.setVisible(false);
    this.musicControls?.destroy({ stopAudio: true });
    this.musicControls = null;
    MusicControls.stopSharedAudio(LEVEL_MUSIC_KEY);
  }

  playFinalTreasureMusic() {
    this.stopLevelMusic();

    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.playFinalTreasureMusic());
      return;
    }

    if (!this.cache.audio.exists(INTRO_MUSIC_KEY)) {
      return;
    }

    this.stopFinalTreasureMusic();
    this.finalTreasureMusic = this.sound.add(INTRO_MUSIC_KEY, {
      loop: true,
      volume: this.getFinalTreasureMusicVolume(),
    });
    this.finalTreasureMusic.play();
  }

  getFinalTreasureMusicVolume() {
    return INTRO_MUSIC_VOLUME * getAudioChannelVolume(AUDIO_CHANNELS.music);
  }

  applyFinalTreasureMusicVolume() {
    this.finalTreasureMusic?.setVolume(this.getFinalTreasureMusicVolume());
  }

  stopFinalTreasureMusic() {
    if (!this.finalTreasureMusic) {
      return;
    }

    this.finalTreasureMusic.stop();
    this.finalTreasureMusic.destroy();
    this.finalTreasureMusic = null;
  }

  showFinalTreasureReveal() {
    const treasureImage = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ...getTextureArgs('treasure'))
      .setScrollFactor(0)
      .setDepth(220)
      .setScale(0.08);
    treasureImage.setData('logicalTextureKey', 'treasure');

    const sourceImage = this.textures.get('treasure').getSourceImage();
    const targetScale = Math.min(
      TREASURE_REVEAL_MAX_WIDTH / sourceImage.width,
      TREASURE_REVEAL_MAX_HEIGHT / sourceImage.height,
    );

    this.tweens.add({
      targets: treasureImage,
      scale: targetScale,
      duration: 820,
      ease: 'Back.out',
      onComplete: () => {
        this.finalTreasureReady = true;
      },
    });

    this.add
      .text(GAME_WIDTH - 36, GAME_HEIGHT - 36, 'Weiter mit Space', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#102237',
        strokeThickness: 6,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(221);

    this.finalTreasureContinueHandler = () => {
      if (!this.finalTreasureReady) {
        return;
      }

      this.finishFinalTreasureSequence();
    };
    this.input.keyboard.on('keydown-SPACE', this.finalTreasureContinueHandler);
  }

  finishFinalTreasureSequence() {
    if (!this.finalTreasureSequenceActive || !this.finalTreasureReady) {
      return;
    }

    if (this.finalTreasureContinueHandler) {
      this.input.keyboard.off('keydown-SPACE', this.finalTreasureContinueHandler);
      this.finalTreasureContinueHandler = null;
    }

    this.finalTreasureReady = false;
    this.showToast(`Level ${this.level.id} geschafft!`);
    this.cameras.main.flash(450, 255, 255, 255);

    this.time.delayedCall(600, () => {
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
    this.resetFallingPlatforms();
    this.playerBossContactDamageArmed = true;
    this.playerBossStompConsumed = false;
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

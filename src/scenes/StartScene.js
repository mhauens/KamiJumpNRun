import Phaser from 'phaser';
import audioIconMuteUrl from '../../assets/shared/audio_icon_mute.webp';
import audioIconPauseUrl from '../../assets/shared/audio_icon_pause.webp';
import audioIconPlayUrl from '../../assets/shared/audio_icon_play.webp';
import audioIconVolumeUrl from '../../assets/shared/audio_icon_volume.webp';
import introMusicMp3Url from '../../assets/shared/KamisWorldIntro.mp3';
import introMusicOggUrl from '../../assets/shared/KamisWorldIntro.ogg';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/dimensions.js';
import { resolveStartLevelIndex } from '../game/devConfig.js';

const BUTTON_WIDTH = 260;
const BUTTON_HEIGHT = 92;
const BUTTON_X = GAME_WIDTH - 190;
const BUTTON_Y = GAME_HEIGHT - 118;
const INTRO_MUSIC_KEY = 'kamis-world-intro';
const INTRO_MUSIC_VOLUME = 0.15;
const MUSIC_PANEL_X = 34;
const MUSIC_PANEL_Y = GAME_HEIGHT - 92;
const MUSIC_PANEL_WIDTH = 282;
const MUSIC_PANEL_HEIGHT = 56;
const MUSIC_TOGGLE_WIDTH = 48;
const MUSIC_TOGGLE_HEIGHT = 48;
const MUSIC_CONTROL_BUTTON_WIDTH = 38;
const MUSIC_CONTROL_BUTTON_HEIGHT = 36;
const MUSIC_SLIDER_X = 176;
const MUSIC_SLIDER_Y = 32;
const MUSIC_SLIDER_WIDTH = 74;
const MUSIC_SLIDER_HEIGHT = 8;
const MUSIC_SLIDER_KNOB_RADIUS = 9;
const MUSIC_ICON_COLOR = 0x143240;
const MUSIC_ICON_KEYS = {
  mute: 'audio-icon-mute',
  pause: 'audio-icon-pause',
  play: 'audio-icon-play',
  volume: 'audio-icon-volume',
};

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    this.hasStartedGame = false;
    this.introMusic = null;
    this.musicPausedByUser = false;
    this.musicMuted = false;
    this.musicVolume = INTRO_MUSIC_VOLUME;
    this.isDraggingVolume = false;
    this.musicControlsExpanded = false;
    this.playIntroMusicWhenUnlocked = () => {
      this.playIntroMusic();
    };

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'start-screen')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.createPlayButton();
    this.loadMusicControlIcons();
    this.loadIntroMusic();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopIntroMusic();
    });

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
    if (this.hasStartedGame) {
      return;
    }

    this.hasStartedGame = true;
    this.stopIntroMusic();

    this.scene.start('LevelScene', {
      levelIndex: resolveStartLevelIndex(),
      score: 0,
    });
  }

  createMusicControls() {
    this.musicPanel = this.add.container(MUSIC_PANEL_X, MUSIC_PANEL_Y);
    const panelBg = this.add.graphics();
    this.musicPanelBg = panelBg;

    panelBg.fillStyle(0xffffff, 0.68);
    panelBg.fillRoundedRect(0, 0, MUSIC_PANEL_WIDTH, MUSIC_PANEL_HEIGHT, 8);
    panelBg.lineStyle(2, MUSIC_ICON_COLOR, 0.65);
    panelBg.strokeRoundedRect(0, 0, MUSIC_PANEL_WIDTH, MUSIC_PANEL_HEIGHT, 8);

    this.musicToggleButton = this.createMusicButton(0, 4, MUSIC_TOGGLE_WIDTH, MUSIC_TOGGLE_HEIGHT, 'volume', () => {
      this.toggleMusicControlsPanel();
    });

    this.playPauseButton = this.createMusicButton(64, 10, MUSIC_CONTROL_BUTTON_WIDTH, MUSIC_CONTROL_BUTTON_HEIGHT, 'pause', () => {
      this.toggleIntroPlayback();
    });

    this.muteButton = this.createMusicButton(110, 10, MUSIC_CONTROL_BUTTON_WIDTH, MUSIC_CONTROL_BUTTON_HEIGHT, 'mute', () => {
      this.toggleIntroMute();
    });

    this.volumeTrack = this.add.graphics();
    this.volumeFill = this.add.graphics();
    this.volumeKnob = this.add.graphics();
    this.volumeIcon = this.add.image(162, MUSIC_SLIDER_Y, MUSIC_ICON_KEYS.volume);
    this.volumeHitArea = this.add
      .rectangle(
        MUSIC_SLIDER_X + MUSIC_SLIDER_WIDTH / 2,
        MUSIC_SLIDER_Y,
        MUSIC_SLIDER_WIDTH + MUSIC_SLIDER_KNOB_RADIUS * 2,
        MUSIC_CONTROL_BUTTON_HEIGHT,
        0xffffff,
        0,
      )
      .setInteractive({ useHandCursor: true });
    this.fitMusicIcon(this.volumeIcon, 26, 22);

    this.volumeHitArea.on('pointerdown', (pointer) => {
      this.isDraggingVolume = true;
      this.setIntroVolumeFromPointer(pointer);
    });

    this.volumeHitArea.on('pointermove', (pointer) => {
      if (this.isDraggingVolume) {
        this.setIntroVolumeFromPointer(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isDraggingVolume = false;
    });

    this.musicPanel.add([
      panelBg,
      ...this.musicToggleButton.parts,
      ...this.playPauseButton.parts,
      ...this.muteButton.parts,
      this.volumeIcon,
      this.volumeTrack,
      this.volumeFill,
      this.volumeKnob,
      this.volumeHitArea,
    ]);

    this.redrawVolumeSlider();
    this.updateMusicControlLabels();
    this.updateMusicControlsVisibility();
  }

  createMusicButton(x, y, width, height, icon, onPointerDown) {
    const bg = this.add.graphics();
    const iconImage = this.add.image(x + width / 2, y + height / 2, MUSIC_ICON_KEYS[icon]);
    const hitArea = this.add
      .rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height,
        0xffffff,
        0,
      )
      .setInteractive({ useHandCursor: true });

    this.drawMusicButtonBackground(bg, x, y, width, height);
    this.fitMusicIcon(iconImage, width - 14, height - 10);

    hitArea.on('pointerdown', onPointerDown);

    return {
      icon,
      iconImage,
      hitArea,
      parts: [bg, iconImage, hitArea],
    };
  }

  drawMusicButtonBackground(graphics, x, y, width, height) {
    graphics.fillStyle(0xffffff, 0.84);
    graphics.fillRoundedRect(x, y, width, height, 8);
    graphics.lineStyle(2, MUSIC_ICON_COLOR, 0.75);
    graphics.strokeRoundedRect(x, y, width, height, 8);
  }

  setMusicButtonIcon(button, icon) {
    button.icon = icon;
    button.iconImage.setTexture(MUSIC_ICON_KEYS[icon]);
    this.fitMusicIcon(
      button.iconImage,
      button.hitArea.width - 14,
      button.hitArea.height - 10,
    );
  }

  fitMusicIcon(image, maxWidth, maxHeight) {
    const source = this.textures.get(image.texture.key).getSourceImage();
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);

    image.setDisplaySize(source.width * scale, source.height * scale);
  }

  toggleMusicControlsPanel() {
    this.musicControlsExpanded = !this.musicControlsExpanded;
    this.updateMusicControlsVisibility();
  }

  updateMusicControlsVisibility() {
    const expandedParts = [
      this.musicPanelBg,
      ...this.playPauseButton.parts,
      ...this.muteButton.parts,
      this.volumeIcon,
      this.volumeTrack,
      this.volumeFill,
      this.volumeKnob,
      this.volumeHitArea,
    ];

    expandedParts.forEach((part) => {
      part.setVisible(this.musicControlsExpanded);
    });

    this.playPauseButton.hitArea.input.enabled = this.musicControlsExpanded;
    this.muteButton.hitArea.input.enabled = this.musicControlsExpanded;
    this.volumeHitArea.input.enabled = this.musicControlsExpanded;
    this.setMusicButtonIcon(this.musicToggleButton, 'volume');
  }

  loadMusicControlIcons() {
    if (Object.values(MUSIC_ICON_KEYS).every((key) => this.textures.exists(key))) {
      this.createMusicControls();
      return;
    }

    this.load.image(MUSIC_ICON_KEYS.mute, audioIconMuteUrl);
    this.load.image(MUSIC_ICON_KEYS.pause, audioIconPauseUrl);
    this.load.image(MUSIC_ICON_KEYS.play, audioIconPlayUrl);
    this.load.image(MUSIC_ICON_KEYS.volume, audioIconVolumeUrl);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.createMusicControls();
    });
    this.load.start();
  }

  loadIntroMusic() {
    if (this.cache.audio.exists(INTRO_MUSIC_KEY)) {
      this.playIntroMusic();
      return;
    }

    this.load.audio(INTRO_MUSIC_KEY, [introMusicOggUrl, introMusicMp3Url]);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.playIntroMusic();
    });
    this.load.start();
  }

  playIntroMusic() {
    if (this.hasStartedGame || this.musicPausedByUser || this.introMusic?.isPlaying) {
      return;
    }

    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, this.playIntroMusicWhenUnlocked);
      return;
    }

    if (!this.cache.audio.exists(INTRO_MUSIC_KEY)) {
      return;
    }

    if (this.introMusic?.isPaused) {
      this.introMusic.resume();
    } else {
      this.introMusic = this.sound.add(INTRO_MUSIC_KEY, {
        loop: true,
        volume: this.musicVolume,
        mute: this.musicMuted,
      });
      this.introMusic.play();
    }

    this.applyIntroMusicSettings();
    this.updateMusicControlLabels();
  }

  toggleIntroPlayback() {
    this.musicPausedByUser = !this.musicPausedByUser;

    if (this.musicPausedByUser) {
      if (this.introMusic?.isPlaying) {
        this.introMusic.pause();
      }
    } else {
      this.playIntroMusic();
    }

    this.updateMusicControlLabels();
  }

  toggleIntroMute() {
    this.musicMuted = !this.musicMuted;
    this.applyIntroMusicSettings();
    this.updateMusicControlLabels();
  }

  setIntroVolumeFromPointer(pointer) {
    const localX = Phaser.Math.Clamp(
      pointer.x - MUSIC_PANEL_X - MUSIC_SLIDER_X,
      0,
      MUSIC_SLIDER_WIDTH,
    );

    this.musicVolume = Phaser.Math.Clamp(localX / MUSIC_SLIDER_WIDTH, 0, 1);
    this.applyIntroMusicSettings();
    this.redrawVolumeSlider();
  }

  applyIntroMusicSettings() {
    if (!this.introMusic) {
      return;
    }

    this.introMusic.setVolume(this.musicVolume);
    this.introMusic.setMute(this.musicMuted);
  }

  updateMusicControlLabels() {
    if (!this.playPauseButton || !this.muteButton) {
      return;
    }

    this.playPauseButton.icon = this.musicPausedByUser ? 'play' : 'pause';
    this.setMusicButtonIcon(this.playPauseButton, this.playPauseButton.icon);
    this.setMusicButtonIcon(this.muteButton, this.musicMuted ? 'volume' : 'mute');
  }

  redrawVolumeSlider() {
    const fillWidth = MUSIC_SLIDER_WIDTH * this.musicVolume;
    const knobX = MUSIC_SLIDER_X + fillWidth;

    this.volumeTrack.clear();
    this.volumeTrack.fillStyle(MUSIC_ICON_COLOR, 0.22);
    this.volumeTrack.fillRoundedRect(
      MUSIC_SLIDER_X,
      MUSIC_SLIDER_Y - MUSIC_SLIDER_HEIGHT / 2,
      MUSIC_SLIDER_WIDTH,
      MUSIC_SLIDER_HEIGHT,
      MUSIC_SLIDER_HEIGHT / 2,
    );

    this.volumeFill.clear();
    if (fillWidth > 0) {
      this.volumeFill.fillStyle(MUSIC_ICON_COLOR, 1);
      this.volumeFill.fillRoundedRect(
        MUSIC_SLIDER_X,
        MUSIC_SLIDER_Y - MUSIC_SLIDER_HEIGHT / 2,
        fillWidth,
        MUSIC_SLIDER_HEIGHT,
        MUSIC_SLIDER_HEIGHT / 2,
      );
    }

    this.volumeKnob.clear();
    this.volumeKnob.fillStyle(0xffffff, 1);
    this.volumeKnob.fillCircle(knobX, MUSIC_SLIDER_Y, MUSIC_SLIDER_KNOB_RADIUS);
    this.volumeKnob.lineStyle(3, MUSIC_ICON_COLOR, 1);
    this.volumeKnob.strokeCircle(knobX, MUSIC_SLIDER_Y, MUSIC_SLIDER_KNOB_RADIUS);
  }

  stopIntroMusic() {
    this.sound.off(Phaser.Sound.Events.UNLOCKED, this.playIntroMusicWhenUnlocked);

    if (!this.introMusic) {
      return;
    }

    this.introMusic.stop();
    this.introMusic.destroy();
    this.introMusic = null;
  }
}

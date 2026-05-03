import Phaser from 'phaser';
import audioIconMuteUrl from '../../assets/shared/audio_icon_mute.webp';
import audioIconPauseUrl from '../../assets/shared/audio_icon_pause.webp';
import audioIconPlayUrl from '../../assets/shared/audio_icon_play.webp';
import audioIconVolumeUrl from '../../assets/shared/audio_icon_volume.webp';

const PANEL_WIDTH = 282;
const PANEL_HEIGHT = 56;
const TOGGLE_WIDTH = 48;
const TOGGLE_HEIGHT = 48;
const BUTTON_WIDTH = 38;
const BUTTON_HEIGHT = 36;
const SLIDER_WIDTH = 74;
const SLIDER_HEIGHT = 8;
const SLIDER_KNOB_RADIUS = 9;
const ICON_COLOR = 0x143240;
const ICON_KEYS = {
  mute: 'audio-icon-mute',
  pause: 'audio-icon-pause',
  play: 'audio-icon-play',
  volume: 'audio-icon-volume',
};
const SHARED_AUDIO = new Map();

export class MusicControls {
  constructor(scene, {
    audioKey,
    audioUrls,
    x,
    y,
    initialVolume,
    align = 'left',
    depth = 180,
    persistBetweenScenes = false,
  }) {
    this.scene = scene;
    this.audioKey = audioKey;
    this.audioUrls = audioUrls;
    this.x = x;
    this.y = y;
    this.initialVolume = initialVolume;
    this.align = align;
    this.depth = depth;
    this.persistBetweenScenes = persistBetweenScenes;
    this.music = null;
    this.userPaused = false;
    this.autoPaused = false;
    this.muted = false;
    this.volume = initialVolume;
    this.draggingVolume = false;
    this.expanded = false;
    this.destroyed = false;
    this.playWhenUnlocked = () => this.play();
    this.releaseVolumeDrag = () => {
      this.draggingVolume = false;
    };
    this.restoreSharedAudioState();
  }

  static stopSharedAudio(audioKey) {
    const sharedEntry = SHARED_AUDIO.get(audioKey);

    if (!sharedEntry?.music) {
      return;
    }

    SHARED_AUDIO.delete(audioKey);
    sharedEntry.music.stop();
    sharedEntry.music.destroy();
  }

  start() {
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
    this.loadAssets();
  }

  restoreSharedAudioState() {
    if (!this.persistBetweenScenes) {
      return;
    }

    const sharedEntry = SHARED_AUDIO.get(this.audioKey);

    if (!sharedEntry?.music) {
      return;
    }

    this.music = sharedEntry.music;
    this.volume = sharedEntry.volume;
    this.muted = sharedEntry.muted;
    this.userPaused = sharedEntry.userPaused;
  }

  syncSharedAudioState() {
    if (!this.persistBetweenScenes || !this.music) {
      return;
    }

    SHARED_AUDIO.set(this.audioKey, {
      music: this.music,
      volume: this.volume,
      muted: this.muted,
      userPaused: this.userPaused,
    });
  }

  trackSharedAudioDestroy() {
    if (!this.persistBetweenScenes || !this.music) {
      return;
    }

    const trackedMusic = this.music;

    trackedMusic.once(Phaser.Sound.Events.DESTROY, () => {
      if (SHARED_AUDIO.get(this.audioKey)?.music === trackedMusic) {
        SHARED_AUDIO.delete(this.audioKey);
      }
    });
  }

  loadAssets() {
    const missingIcons = Object.entries(ICON_KEYS)
      .filter(([, key]) => !this.scene.textures.exists(key));
    const needsAudio = !this.scene.cache.audio.exists(this.audioKey);

    if (missingIcons.length === 0 && !needsAudio) {
      this.createControls();
      this.play();
      return;
    }

    missingIcons.forEach(([name, key]) => {
      const url = {
        mute: audioIconMuteUrl,
        pause: audioIconPauseUrl,
        play: audioIconPlayUrl,
        volume: audioIconVolumeUrl,
      }[name];

      this.scene.load.image(key, url);
    });

    if (needsAudio) {
      this.scene.load.audio(this.audioKey, this.audioUrls);
    }

    this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (this.destroyed) {
        return;
      }

      this.createControls();
      this.play();
    });
    this.scene.load.start();
  }

  createControls() {
    const layout = this.getLayout();
    this.panel = this.scene.add.container(this.x, this.y)
      .setScrollFactor(0)
      .setDepth(this.depth);
    this.panelBg = this.scene.add.graphics().setScrollFactor(0);

    this.panelBg.fillStyle(0xffffff, 0.68);
    this.panelBg.fillRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 8);
    this.panelBg.lineStyle(2, ICON_COLOR, 0.65);
    this.panelBg.strokeRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 8);

    this.toggleButton = this.createButton(layout.toggleX, 4, TOGGLE_WIDTH, TOGGLE_HEIGHT, 'volume', () => {
      this.togglePanel();
    });
    this.playPauseButton = this.createButton(layout.playX, 10, BUTTON_WIDTH, BUTTON_HEIGHT, 'pause', () => {
      this.togglePlayback();
    });
    this.muteButton = this.createButton(layout.muteX, 10, BUTTON_WIDTH, BUTTON_HEIGHT, 'mute', () => {
      this.toggleMute();
    });

    this.sliderX = layout.sliderX;
    this.volumeTrack = this.scene.add.graphics().setScrollFactor(0);
    this.volumeFill = this.scene.add.graphics().setScrollFactor(0);
    this.volumeKnob = this.scene.add.graphics().setScrollFactor(0);
    this.volumeIcon = this.scene.add.image(layout.volumeIconX, 32, ICON_KEYS.volume).setScrollFactor(0);
    this.fitIcon(this.volumeIcon, 26, 22);
    this.volumeHitArea = this.scene.add
      .rectangle(
        this.sliderX + SLIDER_WIDTH / 2,
        32,
        SLIDER_WIDTH + SLIDER_KNOB_RADIUS * 2,
        BUTTON_HEIGHT,
        0xffffff,
        0,
      )
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.volumeHitArea.on('pointerdown', (pointer) => {
      this.draggingVolume = true;
      this.setVolumeFromPointer(pointer);
    });
    this.volumeHitArea.on('pointermove', (pointer) => {
      if (this.draggingVolume) {
        this.setVolumeFromPointer(pointer);
      }
    });
    this.scene.input.on('pointerup', this.releaseVolumeDrag);

    this.panel.add([
      this.panelBg,
      ...this.toggleButton.parts,
      ...this.playPauseButton.parts,
      ...this.muteButton.parts,
      this.volumeIcon,
      this.volumeTrack,
      this.volumeFill,
      this.volumeKnob,
      this.volumeHitArea,
    ]);

    this.redrawSlider();
    this.updateIcons();
    this.updateVisibility();
  }

  getLayout() {
    if (this.align === 'right') {
      return {
        toggleX: PANEL_WIDTH - TOGGLE_WIDTH,
        playX: 12,
        muteX: 58,
        volumeIconX: 110,
        sliderX: 124,
      };
    }

    return {
      toggleX: 0,
      playX: 64,
      muteX: 110,
      volumeIconX: 162,
      sliderX: 176,
    };
  }

  createButton(x, y, width, height, icon, onPointerDown) {
    const bg = this.scene.add.graphics().setScrollFactor(0);
    const iconImage = this.scene.add
      .image(x + width / 2, y + height / 2, ICON_KEYS[icon])
      .setScrollFactor(0);
    const hitArea = this.scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    bg.fillStyle(0xffffff, 0.84);
    bg.fillRoundedRect(x, y, width, height, 8);
    bg.lineStyle(2, ICON_COLOR, 0.75);
    bg.strokeRoundedRect(x, y, width, height, 8);
    this.fitIcon(iconImage, width - 14, height - 10);
    hitArea.on('pointerdown', onPointerDown);

    return {
      icon,
      iconImage,
      hitArea,
      parts: [bg, iconImage, hitArea],
    };
  }

  fitIcon(image, maxWidth, maxHeight) {
    const source = this.scene.textures.get(image.texture.key).getSourceImage();
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);

    image.setDisplaySize(source.width * scale, source.height * scale);
  }

  setButtonIcon(button, icon) {
    button.icon = icon;
    button.iconImage.setTexture(ICON_KEYS[icon]);
    this.fitIcon(button.iconImage, button.hitArea.width - 14, button.hitArea.height - 10);
  }

  togglePanel() {
    this.expanded = !this.expanded;
    this.updateVisibility();
  }

  updateVisibility() {
    const expandedParts = [
      this.panelBg,
      ...this.playPauseButton.parts,
      ...this.muteButton.parts,
      this.volumeIcon,
      this.volumeTrack,
      this.volumeFill,
      this.volumeKnob,
      this.volumeHitArea,
    ];

    expandedParts.forEach((part) => {
      part.setVisible(this.expanded);
    });

    this.playPauseButton.hitArea.input.enabled = this.expanded;
    this.muteButton.hitArea.input.enabled = this.expanded;
    this.volumeHitArea.input.enabled = this.expanded;
  }

  play() {
    this.restoreSharedAudioState();

    if (this.destroyed || this.userPaused || this.autoPaused) {
      this.updateIcons();
      return;
    }

    if (this.music?.isPlaying) {
      this.applySettings();
      this.syncSharedAudioState();
      this.updateIcons();
      return;
    }

    if (this.scene.sound.locked) {
      this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, this.playWhenUnlocked);
      return;
    }

    if (!this.scene.cache.audio.exists(this.audioKey)) {
      return;
    }

    if (this.music?.isPaused) {
      this.music.resume();
    } else {
      this.music = this.scene.sound.add(this.audioKey, {
        loop: true,
        volume: this.volume,
        mute: this.muted,
      });
      this.trackSharedAudioDestroy();
      this.music.play();
    }

    this.applySettings();
    this.syncSharedAudioState();
    this.updateIcons();
  }

  setAutoPaused(autoPaused) {
    if (this.autoPaused === autoPaused) {
      return;
    }

    this.autoPaused = autoPaused;

    if (autoPaused) {
      this.pauseSound();
    } else {
      this.play();
    }

    this.syncSharedAudioState();
    this.updateIcons();
  }

  togglePlayback() {
    if (this.autoPaused) {
      return;
    }

    this.userPaused = !this.userPaused;

    if (this.userPaused) {
      this.pauseSound();
    } else {
      this.play();
    }

    this.updateIcons();
  }

  pauseSound() {
    if (this.music?.isPlaying) {
      this.music.pause();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applySettings();
    this.syncSharedAudioState();
    this.updateIcons();
  }

  setVolumeFromPointer(pointer) {
    const localX = Phaser.Math.Clamp(pointer.x - this.x - this.sliderX, 0, SLIDER_WIDTH);

    this.volume = Phaser.Math.Clamp(localX / SLIDER_WIDTH, 0, 1);
    this.applySettings();
    this.syncSharedAudioState();
    this.redrawSlider();
  }

  applySettings() {
    if (!this.music) {
      return;
    }

    this.music.setVolume(this.volume);
    this.music.setMute(this.muted);
  }

  updateIcons() {
    if (!this.playPauseButton || !this.muteButton) {
      return;
    }

    this.setButtonIcon(this.playPauseButton, this.userPaused || this.autoPaused ? 'play' : 'pause');
    this.setButtonIcon(this.muteButton, this.muted ? 'volume' : 'mute');
  }

  redrawSlider() {
    const fillWidth = SLIDER_WIDTH * this.volume;
    const knobX = this.sliderX + fillWidth;

    this.volumeTrack.clear();
    this.volumeTrack.fillStyle(ICON_COLOR, 0.22);
    this.volumeTrack.fillRoundedRect(
      this.sliderX,
      32 - SLIDER_HEIGHT / 2,
      SLIDER_WIDTH,
      SLIDER_HEIGHT,
      SLIDER_HEIGHT / 2,
    );

    this.volumeFill.clear();
    if (fillWidth > 0) {
      this.volumeFill.fillStyle(ICON_COLOR, 1);
      this.volumeFill.fillRoundedRect(
        this.sliderX,
        32 - SLIDER_HEIGHT / 2,
        fillWidth,
        SLIDER_HEIGHT,
        SLIDER_HEIGHT / 2,
      );
    }

    this.volumeKnob.clear();
    this.volumeKnob.fillStyle(0xffffff, 1);
    this.volumeKnob.fillCircle(knobX, 32, SLIDER_KNOB_RADIUS);
    this.volumeKnob.lineStyle(3, ICON_COLOR, 1);
    this.volumeKnob.strokeCircle(knobX, 32, SLIDER_KNOB_RADIUS);
  }

  destroy({ stopAudio = !this.persistBetweenScenes } = {}) {
    this.destroyed = true;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.playWhenUnlocked);
    this.scene.input.off('pointerup', this.releaseVolumeDrag);

    if (!this.music) {
      return;
    }

    if (!stopAudio) {
      this.syncSharedAudioState();
      this.music = null;
      return;
    }

    if (this.persistBetweenScenes && SHARED_AUDIO.get(this.audioKey)?.music === this.music) {
      SHARED_AUDIO.delete(this.audioKey);
    }

    this.music.stop();
    this.music.destroy();
    this.music = null;
  }
}

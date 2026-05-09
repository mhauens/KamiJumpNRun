import Phaser from 'phaser';
import audioIconMuteUrl from '../../assets/shared/audio_icon_mute.webp';
import audioIconPauseUrl from '../../assets/shared/audio_icon_pause.webp';
import audioIconPlayUrl from '../../assets/shared/audio_icon_play.webp';
import audioIconVolumeUrl from '../../assets/shared/audio_icon_volume.webp';
import {
  AUDIO_CHANNELS,
  getAudioMuted,
  getAudioChannelVolume,
  getAudioSettings,
  setAudioMuted,
  setAudioChannelVolume,
  subscribeAudioSettings,
} from '../utils/audioSettings.js';

const PANEL_WIDTH = 424;
const PANEL_HEIGHT = 92;
const TOGGLE_WIDTH = 48;
const TOGGLE_HEIGHT = 48;
const BUTTON_WIDTH = 38;
const BUTTON_HEIGHT = 36;
const SLIDER_WIDTH = 120;
const SLIDER_HEIGHT = 8;
const SLIDER_KNOB_RADIUS = 9;
const ICON_COLOR = 0x143240;
const MUTE_ACTIVE_BG_COLOR = 0xd7262f;
const MUTE_ACTIVE_BORDER_COLOR = 0xffffff;
const CHANNEL_ROWS = [
  { channel: AUDIO_CHANNELS.music, label: 'Music', y: 20 },
  { channel: AUDIO_CHANNELS.sfx, label: 'SFX', y: 46 },
  { channel: AUDIO_CHANNELS.voice, label: 'Voice', y: 72 },
];
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
    this.baseVolume = initialVolume;
    this.align = align;
    this.depth = depth;
    this.persistBetweenScenes = persistBetweenScenes;
    this.music = null;
    this.userPaused = false;
    this.autoPaused = false;
    this.audioSettings = getAudioSettings();
    this.muted = getAudioMuted();
    this.draggingChannel = null;
    this.expanded = false;
    this.destroyed = false;
    this.channelSliders = new Map();
    this.playWhenUnlocked = () => this.play();
    this.releaseVolumeDrag = () => {
      this.draggingChannel = null;
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
    this.userPaused = sharedEntry.userPaused;
  }

  syncSharedAudioState() {
    if (!this.persistBetweenScenes || !this.music) {
      return;
    }

    SHARED_AUDIO.set(this.audioKey, {
      music: this.music,
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

    this.panelBg.fillStyle(0xffffff, 0.72);
    this.panelBg.fillRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 8);
    this.panelBg.lineStyle(2, ICON_COLOR, 0.65);
    this.panelBg.strokeRoundedRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 8);

    this.toggleButton = this.createButton(layout.toggleX, 4, TOGGLE_WIDTH, TOGGLE_HEIGHT, 'volume', () => {
      this.togglePanel();
    });
    this.playPauseButton = this.createButton(layout.playX, 8, BUTTON_WIDTH, BUTTON_HEIGHT, 'pause', () => {
      this.togglePlayback();
    });
    this.muteButton = this.createButton(layout.playX, 48, BUTTON_WIDTH, BUTTON_HEIGHT, 'mute', () => {
      this.toggleMute();
    });

    CHANNEL_ROWS.forEach((row) => {
      this.channelSliders.set(row.channel, this.createChannelSlider(row, layout));
    });

    this.panel.add([
      this.panelBg,
      ...this.toggleButton.parts,
      ...this.playPauseButton.parts,
      ...this.muteButton.parts,
      ...Array.from(this.channelSliders.values()).flatMap((slider) => slider.parts),
    ]);

    this.unsubscribeAudioSettings = subscribeAudioSettings((settings) => {
      this.audioSettings = settings;
      this.muted = Boolean(settings.muted);
      this.applySettings();
      this.redrawSliders();
      this.updateIcons();
    });

    this.redrawSliders();
    this.updateIcons();
    this.updateVisibility();
  }

  getLayout() {
    if (this.align === 'right') {
      return {
        toggleX: PANEL_WIDTH - TOGGLE_WIDTH,
        playX: 14,
        labelX: 116,
        sliderX: 188,
        valueX: 326,
      };
    }

    return {
      toggleX: 0,
      playX: 66,
      labelX: 166,
      sliderX: 238,
      valueX: 376,
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

    this.drawButtonBackground(bg, x, y, width, height);
    this.fitIcon(iconImage, width - 14, height - 10);
    hitArea.on('pointerdown', onPointerDown);

    return {
      icon,
      bg,
      iconImage,
      hitArea,
      x,
      y,
      width,
      height,
      parts: [bg, iconImage, hitArea],
    };
  }

  createChannelSlider({ channel, label, y }, layout) {
    const labelText = this.scene.add
      .text(layout.labelX, y - 11, label, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#143240',
      })
      .setScrollFactor(0);
    const track = this.scene.add.graphics().setScrollFactor(0);
    const fill = this.scene.add.graphics().setScrollFactor(0);
    const knob = this.scene.add.graphics().setScrollFactor(0);
    const valueText = this.scene.add
      .text(layout.valueX, y - 12, '', {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '14px',
        color: '#143240',
      })
      .setScrollFactor(0);
    const hitArea = this.scene.add
      .rectangle(
        layout.sliderX + SLIDER_WIDTH / 2,
        y,
        SLIDER_WIDTH + SLIDER_KNOB_RADIUS * 2,
        BUTTON_HEIGHT,
        0xffffff,
        0,
      )
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', (pointer) => {
      this.draggingChannel = channel;
      this.setVolumeFromPointer(pointer, channel);
    });
    hitArea.on('pointermove', (pointer) => {
      if (this.draggingChannel === channel) {
        this.setVolumeFromPointer(pointer, channel);
      }
    });
    this.scene.input.on('pointerup', this.releaseVolumeDrag);

    return {
      channel,
      y,
      sliderX: layout.sliderX,
      labelText,
      track,
      fill,
      knob,
      valueText,
      hitArea,
      parts: [labelText, track, fill, knob, valueText, hitArea],
    };
  }

  drawButtonBackground(
    bg,
    x,
    y,
    width,
    height,
    {
      fillColor = 0xffffff,
      fillAlpha = 0.84,
      borderColor = ICON_COLOR,
      borderAlpha = 0.75,
    } = {},
  ) {
    bg.clear();
    bg.fillStyle(fillColor, fillAlpha);
    bg.fillRoundedRect(x, y, width, height, 8);
    bg.lineStyle(2, borderColor, borderAlpha);
    bg.strokeRoundedRect(x, y, width, height, 8);
  }

  fitIcon(image, maxWidth, maxHeight) {
    const source = this.scene.textures.get(image.texture.key).getSourceImage();
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);

    image.setDisplaySize(source.width * scale, source.height * scale);
  }

  setButtonIcon(button, icon, { white = false } = {}) {
    button.icon = icon;
    button.iconImage.setTexture(white ? this.getWhiteIconKey(icon) : ICON_KEYS[icon]);
    this.fitIcon(button.iconImage, button.hitArea.width - 14, button.hitArea.height - 10);
  }

  getWhiteIconKey(icon) {
    const sourceKey = ICON_KEYS[icon];
    const whiteKey = `${sourceKey}-white`;

    if (this.scene.textures.exists(whiteKey)) {
      return whiteKey;
    }

    const sourceImage = this.scene.textures.get(sourceKey).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceImage, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) {
        continue;
      }

      pixels[index] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
    }

    context.putImageData(imageData, 0, 0);
    this.scene.textures.addCanvas(whiteKey, canvas);

    return whiteKey;
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
      ...Array.from(this.channelSliders.values()).flatMap((slider) => slider.parts),
    ];

    expandedParts.forEach((part) => {
      part.setVisible(this.expanded);
    });

    this.playPauseButton.hitArea.input.enabled = this.expanded;
    this.muteButton.hitArea.input.enabled = this.expanded;
    this.channelSliders.forEach((slider) => {
      slider.hitArea.input.enabled = this.expanded;
    });
  }

  play() {
    if (!this.music) {
      this.restoreSharedAudioState();
    }

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
        volume: this.getMusicVolume(),
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

    this.syncSharedAudioState();
    this.updateIcons();
  }

  pauseSound() {
    if (this.music?.isPlaying) {
      this.music.pause();
    }
  }

  toggleMute() {
    setAudioMuted(!getAudioMuted());
  }

  setVolumeFromPointer(pointer, channel) {
    const slider = this.channelSliders.get(channel);

    if (!slider) {
      return;
    }

    const localX = Phaser.Math.Clamp(pointer.x - this.x - slider.sliderX, 0, SLIDER_WIDTH);

    setAudioChannelVolume(channel, localX / SLIDER_WIDTH);
  }

  getMusicVolume() {
    return this.baseVolume * getAudioChannelVolume(AUDIO_CHANNELS.music);
  }

  applySettings() {
    this.scene.sound.mute = this.muted;

    if (this.music) {
      this.music.setVolume(this.getMusicVolume());
      this.music.setMute(false);
    }
  }

  updateIcons() {
    if (!this.playPauseButton || !this.muteButton) {
      return;
    }

    this.setButtonIcon(this.playPauseButton, this.userPaused || this.autoPaused ? 'play' : 'pause');
    this.setButtonIcon(this.muteButton, 'mute', { white: this.muted });
    this.drawButtonBackground(
      this.muteButton.bg,
      this.muteButton.x,
      this.muteButton.y,
      this.muteButton.width,
      this.muteButton.height,
      this.muted
        ? {
          fillColor: MUTE_ACTIVE_BG_COLOR,
          fillAlpha: 1,
          borderColor: MUTE_ACTIVE_BORDER_COLOR,
          borderAlpha: 0.95,
        }
        : undefined,
    );
  }

  redrawSliders() {
    this.channelSliders.forEach((slider) => this.redrawSlider(slider));
  }

  redrawSlider(slider) {
    const volume = getAudioChannelVolume(slider.channel);
    const fillWidth = SLIDER_WIDTH * volume;
    const knobX = slider.sliderX + fillWidth;

    slider.track.clear();
    slider.track.fillStyle(ICON_COLOR, 0.22);
    slider.track.fillRoundedRect(
      slider.sliderX,
      slider.y - SLIDER_HEIGHT / 2,
      SLIDER_WIDTH,
      SLIDER_HEIGHT,
      SLIDER_HEIGHT / 2,
    );

    slider.fill.clear();
    if (fillWidth > 0) {
      slider.fill.fillStyle(ICON_COLOR, 1);
      slider.fill.fillRoundedRect(
        slider.sliderX,
        slider.y - SLIDER_HEIGHT / 2,
        fillWidth,
        SLIDER_HEIGHT,
        SLIDER_HEIGHT / 2,
      );
    }

    slider.knob.clear();
    slider.knob.fillStyle(0xffffff, 1);
    slider.knob.fillCircle(knobX, slider.y, SLIDER_KNOB_RADIUS);
    slider.knob.lineStyle(3, ICON_COLOR, 1);
    slider.knob.strokeCircle(knobX, slider.y, SLIDER_KNOB_RADIUS);
    slider.valueText.setText(`${Math.round(volume * 100)}%`);
  }

  destroy({ stopAudio = !this.persistBetweenScenes } = {}) {
    this.destroyed = true;
    this.unsubscribeAudioSettings?.();
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

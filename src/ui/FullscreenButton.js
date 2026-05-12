import Phaser from 'phaser';
import {
  isAppleTouchDevice,
  isIPhoneTouchDevice,
  isStandaloneAppleWebApp,
} from '../utils/device.js';

const BUTTON_SIZE = 48;
const BUTTON_RADIUS = 8;
const ICON_COLOR = 0x143240;
const BANNER_WIDTH = 920;
const BANNER_HEIGHT = 92;
const BANNER_TOP = 24;
const BANNER_CLOSE_SIZE = 38;

export class FullscreenButton {
  constructor(scene, {
    x,
    y,
    depth = 180,
  }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.depth = depth;
    this.destroyed = false;
    this.toggleFullscreen = () => this.handleToggleFullscreen();
    this.dismissBanner = () => this.hideFallbackBanner();
  }

  static get size() {
    return BUTTON_SIZE;
  }

  static shouldShow() {
    return isAppleTouchDevice();
  }

  start() {
    if (!FullscreenButton.shouldShow()) {
      return;
    }

    this.createButton();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
  }

  createButton() {
    this.container = this.scene.add.container(this.x, this.y)
      .setScrollFactor(0)
      .setDepth(this.depth)
      .setSize(BUTTON_SIZE, BUTTON_SIZE);

    this.background = this.scene.add.graphics().setScrollFactor(0);
    this.icon = this.scene.add.graphics().setScrollFactor(0);
    this.hitArea = this.scene.add
      .rectangle(BUTTON_SIZE / 2, BUTTON_SIZE / 2, BUTTON_SIZE, BUTTON_SIZE, 0xffffff, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.drawBackground();
    this.drawExpandIcon();
    this.hitArea.on('pointerup', this.toggleFullscreen);
    this.container.add([this.background, this.icon, this.hitArea]);
  }

  drawBackground() {
    this.background.clear();
    this.background.fillStyle(0xffffff, 0.84);
    this.background.fillRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);
    this.background.lineStyle(2, ICON_COLOR, 0.75);
    this.background.strokeRoundedRect(0, 0, BUTTON_SIZE, BUTTON_SIZE, BUTTON_RADIUS);
  }

  drawExpandIcon() {
    this.icon.clear();
    this.icon.lineStyle(4, ICON_COLOR, 1);

    this.icon.beginPath();
    this.icon.moveTo(20, 20);
    this.icon.lineTo(12, 12);
    this.icon.moveTo(12, 12);
    this.icon.lineTo(12, 23);
    this.icon.moveTo(12, 12);
    this.icon.lineTo(23, 12);

    this.icon.moveTo(28, 28);
    this.icon.lineTo(36, 36);
    this.icon.moveTo(36, 36);
    this.icon.lineTo(36, 25);
    this.icon.moveTo(36, 36);
    this.icon.lineTo(25, 36);
    this.icon.strokePath();
  }

  handleToggleFullscreen() {
    if (isIPhoneTouchDevice() && !this.canRequestFullscreen()) {
      this.showIPhoneFullscreenFallback();
      return;
    }

    if (this.scene.scale.isFullscreen) {
      this.scene.scale.stopFullscreen();
      return;
    }

    this.scene.scale.startFullscreen();
  }

  canRequestFullscreen() {
    const fullscreenTarget = this.scene.scale.fullscreenTarget ||
      this.scene.scale.parent ||
      document.documentElement;

    return Boolean(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      fullscreenTarget.requestFullscreen ||
      fullscreenTarget.webkitRequestFullscreen,
    );
  }

  showIPhoneFullscreenFallback() {
    const message = isStandaloneAppleWebApp()
      ? 'iPhone ist schon im Web-App-Vollbildmodus'
      : 'iPhone: Teilen > Zum Home-Bildschirm, dann von dort starten';

    this.showFallbackBanner(message);
  }

  showFallbackBanner(message) {
    this.hideFallbackBanner();

    const width = Math.min(BANNER_WIDTH, this.scene.scale.gameSize.width - 56);
    const x = (this.scene.scale.gameSize.width - width) / 2;
    const closeX = width - BANNER_CLOSE_SIZE / 2 - 14;
    const closeY = BANNER_HEIGHT / 2;

    this.fallbackBanner = this.scene.add.container(x, BANNER_TOP)
      .setScrollFactor(0)
      .setDepth(this.depth + 20);

    const shadow = this.scene.add.graphics().setScrollFactor(0);
    shadow.fillStyle(0x061323, 0.42);
    shadow.fillRoundedRect(0, 8, width, BANNER_HEIGHT, 8);

    const background = this.scene.add.graphics().setScrollFactor(0);
    background.fillStyle(0xffffff, 0.94);
    background.fillRoundedRect(0, 0, width, BANNER_HEIGHT, 8);
    background.lineStyle(2, ICON_COLOR, 0.72);
    background.strokeRoundedRect(0, 0, width, BANNER_HEIGHT, 8);

    const label = this.scene.add
      .text(24, BANNER_HEIGHT / 2, message, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#143240',
        wordWrap: { width: width - BANNER_CLOSE_SIZE - 64 },
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    const closeBg = this.scene.add.graphics().setScrollFactor(0);
    closeBg.fillStyle(0x143240, 0.1);
    closeBg.fillRoundedRect(
      closeX - BANNER_CLOSE_SIZE / 2,
      closeY - BANNER_CLOSE_SIZE / 2,
      BANNER_CLOSE_SIZE,
      BANNER_CLOSE_SIZE,
      8,
    );
    closeBg.lineStyle(2, ICON_COLOR, 0.5);
    closeBg.strokeRoundedRect(
      closeX - BANNER_CLOSE_SIZE / 2,
      closeY - BANNER_CLOSE_SIZE / 2,
      BANNER_CLOSE_SIZE,
      BANNER_CLOSE_SIZE,
      8,
    );

    const closeIcon = this.scene.add.graphics().setScrollFactor(0);
    closeIcon.lineStyle(4, ICON_COLOR, 1);
    closeIcon.lineBetween(closeX - 9, closeY - 9, closeX + 9, closeY + 9);
    closeIcon.lineBetween(closeX + 9, closeY - 9, closeX - 9, closeY + 9);

    const closeHitArea = this.scene.add
      .rectangle(closeX, closeY, BANNER_CLOSE_SIZE, BANNER_CLOSE_SIZE, 0xffffff, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    closeHitArea.on('pointerup', this.dismissBanner);
    this.fallbackBannerCloseHitArea = closeHitArea;
    this.fallbackBanner.add([
      shadow,
      background,
      label,
      closeBg,
      closeIcon,
      closeHitArea,
    ]);
  }

  hideFallbackBanner() {
    this.fallbackBannerCloseHitArea?.off('pointerup', this.dismissBanner);
    this.fallbackBannerCloseHitArea = null;
    this.fallbackBanner?.destroy();
    this.fallbackBanner = null;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.hideFallbackBanner();
    this.hitArea?.off('pointerup', this.toggleFullscreen);
    this.container?.destroy();
  }
}

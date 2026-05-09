export function installVisibilityMute(game) {
  if (typeof document === 'undefined') {
    return;
  }

  let previousMute = false;
  let visibilityMuted = false;

  const applyVisibilityMute = () => {
    if (document.hidden) {
      if (!visibilityMuted) {
        previousMute = Boolean(game.sound.mute);
      }

      visibilityMuted = true;
      game.sound.mute = true;
      return;
    }

    if (!visibilityMuted) {
      return;
    }

    visibilityMuted = false;
    game.sound.mute = previousMute;
  };

  document.addEventListener('visibilitychange', applyVisibilityMute);
  applyVisibilityMute();
}

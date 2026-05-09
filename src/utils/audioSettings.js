const AUDIO_SETTINGS_KEY = 'kamis-world-audio-settings';

export const AUDIO_CHANNELS = {
  music: 'music',
  sfx: 'sfx',
  voice: 'voice',
};

const DEFAULT_AUDIO_SETTINGS = {
  [AUDIO_CHANNELS.music]: 1,
  [AUDIO_CHANNELS.sfx]: 1,
  [AUDIO_CHANNELS.voice]: 1,
  muted: false,
};

let audioSettings = loadAudioSettings();
const listeners = new Set();

function clampVolume(value) {
  return Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 1;
}

function loadAudioSettings() {
  try {
    const rawValue = window.localStorage.getItem(AUDIO_SETTINGS_KEY);

    if (!rawValue) {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }

    const parsed = JSON.parse(rawValue);

    return {
      ...DEFAULT_AUDIO_SETTINGS,
      [AUDIO_CHANNELS.music]: clampVolume(parsed[AUDIO_CHANNELS.music]),
      [AUDIO_CHANNELS.sfx]: clampVolume(parsed[AUDIO_CHANNELS.sfx]),
      [AUDIO_CHANNELS.voice]: clampVolume(parsed[AUDIO_CHANNELS.voice]),
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

function persistAudioSettings() {
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
  } catch {
    // Ignore unavailable localStorage.
  }
}

function notifyAudioSettingsChanged() {
  listeners.forEach((listener) => listener({ ...audioSettings }));
}

export function getAudioSettings() {
  return { ...audioSettings };
}

export function getAudioChannelVolume(channel) {
  return audioSettings[channel] ?? 1;
}

export function getAudioMuted() {
  return Boolean(audioSettings.muted);
}

export function setAudioChannelVolume(channel, volume) {
  if (!Object.values(AUDIO_CHANNELS).includes(channel)) {
    return;
  }

  const nextVolume = clampVolume(volume);

  if (audioSettings[channel] === nextVolume) {
    return;
  }

  audioSettings = {
    ...audioSettings,
    [channel]: nextVolume,
  };
  persistAudioSettings();
  notifyAudioSettingsChanged();
}

export function setAudioMuted(muted) {
  const nextMuted = Boolean(muted);

  if (audioSettings.muted === nextMuted) {
    return;
  }

  audioSettings = {
    ...audioSettings,
    muted: nextMuted,
  };
  persistAudioSettings();
  notifyAudioSettingsChanged();
}

export function subscribeAudioSettings(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

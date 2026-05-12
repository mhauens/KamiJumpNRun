export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isIPhoneTouchDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iPhone|iPod/.test(navigator.userAgent);
}

export function isStandaloneAppleWebApp() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.navigator.standalone) ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches;
}

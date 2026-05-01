export const HIGH_SCORE_KEY = 'kamis-world-highscore';
const LEGACY_HIGH_SCORE_KEY = 'kami-jump-run-highscore';

export function loadHighScore() {
  try {
    const rawValue = window.localStorage.getItem(HIGH_SCORE_KEY)
      ?? window.localStorage.getItem(LEGACY_HIGH_SCORE_KEY);

    if (!rawValue) {
      return 0;
    }

    const parsed = Number.parseInt(rawValue, 10);
    const highScore = Number.isFinite(parsed) ? parsed : 0;

    if (highScore > 0 && !window.localStorage.getItem(HIGH_SCORE_KEY)) {
      window.localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }

    return highScore;
  } catch {
    return 0;
  }
}

export function saveHighScore(score) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Ignore unavailable localStorage.
  }
}

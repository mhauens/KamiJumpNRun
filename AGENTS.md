# AGENTS.md

This project is a Phaser 3 browser platformer using Vite. Keep changes focused and verify with `pnpm build` after code changes.

## Project Overview

- Entry point: `src/main.js`
- Phaser config: `src/game/config.js`
- Dimensions: `src/game/dimensions.js`
- Level data and boss overrides: `src/data/levels.js`
- Scenes:
  - `src/scenes/BootScene.js`: asset loading, generated textures, animation frame preparation
  - `src/scenes/StartScene.js`: title screen and play button
  - `src/scenes/LevelScene.js`: gameplay, player movement, boss fights, HUD, retries
  - `src/scenes/EndScene.js`: game completion screen
- Local storage helpers: `src/utils/storage.js`

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
```

Use `pnpm build` as the baseline verification command.

## Assets

Assets are intentionally grouped:

- `assets/backgrounds/`
- `assets/mainChar/`
- `assets/shared/`
- `assets/boss_1/`
- `assets/boss_2/`
- `assets/boss_3/`

Each boss should keep its own assets in `assets/boss_<level>/`. Boss asset names follow the existing pattern:

```text
boss_<level>_stand.png
boss_<level>_move.png
boss_<level>_hit.png
boss_<level>_attack.png
boss_<level>_defeated.png
boss_<level>_shot.png
boss_<level>_splashscreen.png
boss_<level>_retry_splashscreen.png
mainChar_<level>_hit.png
```

`BootScene` falls back to Boss 1 assets if a later boss is missing a file. Prefer adding the real asset rather than relying on fallback for production behavior.

## Boss Implementation Notes

Boss behavior and per-boss tuning live mostly in `src/data/levels.js` under each level's optional `boss` object. Defaults are defined at the top of that file.

Common per-boss overrides include:

- `shotOffsetX`
- `shotOffsetY`
- `shotScale`
- `shotBodyWidth`
- `shotBodyHeight`
- `defeatedScaleMultiplier`
- `defeatedFootSink`

Boss animation frame generation is in `BootScene`. Some bosses need specific attack framing because their sprite frames extend past the nominal sheet cell. Keep such exceptions narrowly scoped to the affected boss/source key so existing bosses do not regress.

## Level Pickup Placement

Coins and balls in `src/data/levels.js` must be distributed intentionally across the level. They should not be too close together, should not overlap each other, and should remain reachable.

For walkable ground blocks, do not place coins or balls below the actual grass/top surface of the platform they belong to. Pickups must sit above the surface, not inside the dirt/body area below the floor. Small floating platforms are exempt from this specific "below the ground surface" rule, but pickups on or near them should still be reachable and visually clear.

## iPad and Safari Notes

iPad Safari and iPad Chrome are WebKit-based and can lose the WebGL context with large generated boss textures. `src/game/config.js` forces Phaser Canvas rendering on Apple touch devices. Do not remove that without testing on a real iPad.

Avoid generating large runtime canvas textures unnecessarily. Boss animations are generated lazily when the boss fight is reached, not during initial boot.

When manipulating canvas pixel data, be careful with `getImageData` on mobile Safari. The current boss frame code removes edge-connected white background and preserves light sprite details such as shoes or feet.

## Development Start Level

`src/game/devConfig.js` reads `VITE_START_LEVEL` only in development. Use `.env.development.local` for local testing and restart Vite after changes. `.env*.local` is ignored by git.

## Git and Generated Files

Do not commit:

- `node_modules/`
- `dist/`
- `.env*.local`
- log files

Do not move assets back into the root `assets/` folder. Keep the folder structure clear as more bosses and levels are added.

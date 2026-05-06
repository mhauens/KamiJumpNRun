# AGENTS.md

This project is a Phaser 3 browser platformer using Vite. Keep changes focused and verify with `pnpm build` after code changes.

## Project Overview

- Entry point: `src/main.js`
- Phaser config: `src/game/config.js`
- Dimensions: `src/game/dimensions.js`
- Level data and boss overrides: `src/data/levels.js`
- Boss splash audio discovery: `src/data/bossSplashAudio.js`
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
- `assets/boss_4/`
- `assets/boss_5/`
- `assets/boss_6/`

Each boss should keep its own assets in `assets/boss_<level>/`. Boss asset names follow the existing pattern:

```text
boss_<level>_stand.webp
boss_<level>_move.webp
boss_<level>_hit.webp
boss_<level>_attack.webp
boss_<level>_defeated.webp
boss_<level>_shot.webp
boss_<level>_splashscreen.webp
boss_<level>_retry_splashscreen.webp
mainChar_<level>_hit.webp
```

Optional per-boss assets include:

```text
boss_<level>_puddle.png
boss_<level>_puddle.webp
boss_<level>_charge.webp
mainChar_<level>_charge.webp
```

Boss 6 has phase-two assets with `_2` suffixes, plus optional special attack/projectile assets:

```text
boss_6_stand_2.webp
boss_6_move_2.webp
boss_6_hit_2.webp
boss_6_attack_2.webp
boss_6_attack_2_special.webp
boss_6_defeated_2.webp
boss_6_shot_2.webp
boss_6_shot_2_special.webp
boss_6_splashscreen_2.webp
boss_6_retry_splashscreen_2.webp
mainChar_6_hit_2.webp
```

Splash audio lives under `assets/boss_<level>/splashscreenSounds/` and is discovered by filename. Use `boss_<level>_<clip>.ogg` / `.mp3`; for Boss 6 phase two use `boss_6_<clip>_2.ogg` / `.mp3`.

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
- `phase2`
- `projectileFrame`
- `specialAttackDamage`
- `specialShotScale`
- `specialShotBodyHeight`

Boss animation frame generation is in `BootScene`. Some bosses need specific attack framing because their sprite frames extend past the nominal sheet cell. Keep such exceptions narrowly scoped to the affected boss/source key so existing bosses do not regress.

Boss 5 can use the optional charge animation. Boss 6 has a phase-two fight; keep phase-two tuning in the nested `boss.phase2` object in `src/data/levels.js`.

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
- `package-lock.json`

Commit `pnpm-lock.yaml` when dependencies change. Do not add npm or yarn lockfiles.

Do not move assets back into the root `assets/` folder. Keep the folder structure clear as more bosses and levels are added.

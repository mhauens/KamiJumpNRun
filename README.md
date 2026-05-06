# Kami's World

Kami's World is a browser platformer built with Phaser and Vite. The player runs, jumps, collects coins and balls, activates checkpoints, and fights a boss at the end of each level. Boss fights include splash screens, countdowns, custom boss animations, projectiles, health bars, retry screens, and level-specific assets.

The game is designed for desktop browsers and touch devices. Apple touch devices use Phaser's Canvas renderer because iPad Safari and iPad Chrome can lose the WebGL context when handling the large boss assets.

## Requirements

- Node.js
- pnpm 10.33.0

## Install

```bash
pnpm install
```

## Start Development Server

```bash
pnpm dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## Build

```bash
pnpm build
```

## Preview Production Build

```bash
pnpm preview
```

## Development Start Level

For testing, you can start directly in a specific level by setting `VITE_START_LEVEL` in `.env.development.local`.

```env
VITE_START_LEVEL=3
```

Use the visible level number. Leave it empty, remove the file, or use an invalid value to start normally at Level 1. Restart the Vite dev server after changing env files.

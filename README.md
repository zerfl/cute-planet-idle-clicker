# Cute Planet Idle Clicker 🪐

A cosy pastel idle/clicker game built with **React 19 + TypeScript + Vite**. Tap
your planet, hatch animals, collect stars and moons, craft cosmetics, ride cosmic
events, prestige, and drift into the glitch galaxy. The simulation runs in a
**Web Worker** so the main thread stays smooth, with optional **Firebase** cloud
sync.

## Tech stack

- **UI:** React 19, Tailwind CSS v4, Framer Motion (`motion`), lucide-react
- **Build:** Vite 6, esbuild (server bundle), Express dev/prod server (`server.ts`)
- **Game loop:** a dedicated Web Worker (`src/game.worker.ts`)
- **Persistence:** `localStorage` + Firebase (Firestore) cloud sync
- **Quality:** TypeScript (strict typecheck), ESLint (flat config), Prettier,
  Vitest + Testing Library, Husky + lint-staged

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install                 # install dependencies
# optional: set GEMINI_API_KEY / Firebase keys in .env.local (see .env.example)
npm run dev                 # start the Express + Vite dev server (http://localhost:3000)
```

`npm run watch` runs the plain Vite dev server instead.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Express server with Vite middleware (dev) |
| `npm run watch` | Vite dev server only |
| `npm run build` | Production build (Vite client + esbuild server bundle) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run check` | typecheck + lint + format:check + test (CI-style gate) |

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files).

## Project structure

```
src/
  App.tsx              # root component / orchestrator
  main.tsx             # React entry point
  game.worker.ts       # Web Worker: tick loop, timers, state broadcast
  types.ts             # shared domain types
  components/          # UI: layout, overlays, Planet, ui/, modals/
  contexts/            # GameStateContext (limits modal re-renders per tick)
  game/                # pure game logic
    protocol.ts        #   typed worker <-> UI message contract (single source of truth)
    workerActions.ts   #   command reducers (BUY_*, CRAFT_*, PRESTIGE, …)
    statsCalculator.ts #   LPS / click-power / multipliers (hot path)
    engine.ts, planetTasks.ts, achievements.ts, itemHandlers.ts, blackHoleGamble.ts
  data/                # content/config: animals, upgrades, recipes, cosmetics, events, …
  hooks/               # useGameWorker-adjacent hooks, useModalState, useFloatingTexts,
                       #   useDisplayPreferences, useFirebaseSync, useAudioSettings, …
  lib/firebase.ts      # Firebase init
  utils/               # audio, offline earnings, number formatting
  test/setup.ts        # Vitest/jsdom setup
```

### Worker protocol

The UI thread and the game worker communicate through a typed contract in
`src/game/protocol.ts`:

- `WorkerCommand` — messages the UI sends to the worker (`BUY_ANIMAL`, `CLICK`, …)
- `WorkerEvent` — messages the worker sends back (`STATE_UPDATE`, `STAR_TRIGGER`, …)
- `WorkerGameState` / `WorkerStatePayload` — the authoritative game state shapes

Because both sides import these types, a payload mismatch is a compile error
rather than a silent runtime bug.

## Testing

Tests live next to the code they cover (`*.test.ts`) and run under Vitest with a
jsdom environment. Pure game logic (engine, stats, crafting, offline, worker
reducers) is unit-tested; React hooks use `@testing-library/react`.
`statsCalculator` is covered by **characterization tests** (inline snapshots) so
performance refactors stay behaviour-identical.

```bash
npm test
```

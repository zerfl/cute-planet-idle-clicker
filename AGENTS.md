# AGENTS.md

Cute Planet Idle Clicker — a cosy pastel idle/clicker game (React 19 + TypeScript +
Vite). The game simulation runs in a Web Worker; persistence is `localStorage` with
optional Firebase (Firestore) cloud sync.

## Setup

- Package manager: **npm** (there is a `package-lock.json`). Node 20+.
- Install: `npm install`
- Dev server: `npm run dev` (Express + Vite on http://localhost:3000)
- Tests: `npm test`
- Gate before you finish: `npm run check` (typecheck + lint + format:check + test) — this
  is what CI runs.

## How this codebase works (the parts that matter everywhere)

- **State lives in the worker.** UI is largely a view. Game state changes go through the
  typed worker protocol in `src/game/protocol.ts` (the single source of truth) — the UI
  sends `WorkerCommand`s and applies the `WorkerEvent`s the worker sends back.
- **Content is data-driven.** Animals, upgrades, recipes, cosmetics, events, zodiacs, etc.
  are rows under `src/data/`. Add content there, not as hardcoded logic in components.
- **Content is bilingual.** Content types carry `germanName` / `germanDescription`
  alongside their English fields — keep both in sync.

## Conventions

- Commits: Conventional Commits with domain scopes, e.g. `feat(roguelite):`, `fix(sync):`.
  Do **not** put Claude / Claude Code / AI-assistant branding in commit messages or files.
- Comments: sparingly — only where the code isn't self-explanatory.
- Code style is enforced by Prettier + ESLint; after a large changeset and before
  committing, run `npm run lint:fix && npm run format` (auto-fixes unused imports, Tailwind
  canonical classes, and formatting). `exhaustive-deps` and `any` are judgement calls — see
  the "Auto-fix before you commit" note in `docs/conventions.md`.

## Where to look next (read these only when the task needs them)

- Running, scripts, project structure, worker-protocol overview → `README.md`
- Architecture & the game loop → `docs/architecture.md`
- Adding a feature or a new worker command → `docs/adding-features.md`
- Saves, cloud sync, reset, offline earnings → `docs/persistence.md`
- Firebase, Firestore rules, env vars → `docs/firebase.md`
- Roguelite (Galaxy Voyage) → `docs/roguelite.md`
- Domain terms & the German naming convention → `docs/glossary.md`
- Commit, code-style & testing conventions → `docs/conventions.md`
- React performance rules → `.agents/skills/vercel-react-best-practices/`
